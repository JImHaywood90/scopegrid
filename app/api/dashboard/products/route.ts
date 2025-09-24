import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productCatalog } from '@/lib/db/schema';

export const runtime = 'nodejs';

type BundleRequest = {
  Version?: string;
  SequenceNumber: number;
  ResourceType: string; // 'agreement' | 'configuration' | 'addition'
  ApiRequest: {
    id?: number;
    parentId?: number;
    grandParentId?: number;
    filters?: { conditions?: string; orderBy?: string; childConditions?: string; customFieldConditions?: string };
    page?: { page?: number; pageSize?: number; pageId?: number };
    fields?: string;
    miscProperties?: Record<string, unknown>;
  };
};

type BundleResult = {
  sequenceNumber: number;
  resourceType?: string;
  entities?: any[];
  data?: any;
  success: boolean;
  statusCode: number;
  error?: { code?: string; message?: string } | null;
};

type BundleResponse = { results: BundleResult[] };

const CHUNK = 50;
const lc = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');

export async function GET(req: NextRequest) {
  try {
    // 0) Resolve company identifier:
    //    - query param takes priority (optional)
    //    - else cookie 'sg.companyIdentifier'
    const sp = req.nextUrl.searchParams;
    const fromQuery = sp.get('companyIdentifier') || sp.get('CompanyIdentifier') || '';
    const fromCookie = req.cookies.get('sg.companyIdentifier')?.value ||
      // fallback parse if ever needed
      (req.headers.get('cookie')?.match(/(?:^|;\s*)sg\.companyIdentifier=([^;]+)/)?.[1] ?? '');

    const companyIdentifier = fromQuery || fromCookie;

    if (!companyIdentifier) {
      return NextResponse.json(
        { error: 'No company selected. Use the picker, or pass ?companyIdentifier=ACME.' },
        { status: 400 }
      );
    }

    // 1) Catalog (only fields we need)
    const catalog = await db
      .select({
        id: productCatalog.id,
        slug: productCatalog.slug,
        name: productCatalog.name,
        vendor: productCatalog.vendor,
        category: productCatalog.category,
        logoLightPath: productCatalog.logoLightPath,
        matchTerms: productCatalog.matchTerms,
      })
      .from(productCatalog);

    // 2) Bundle #1: agreements (active) + configurations (active) for this company
    const firstBundle: BundleRequest[] = [
      {
        Version: '2020.1',
        SequenceNumber: 1,
        ResourceType: 'agreement',
        ApiRequest: {
          filters: {
            conditions: `company/identifier="${companyIdentifier}" and agreementStatus="Active" and cancelledFlag=false`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
      {
        Version: '2020.1',
        SequenceNumber: 2,
        ResourceType: 'configuration',
        ApiRequest: {
          filters: {
            // If a tenant uses activeFlag instead of status/name, you can OR it in:
            // conditions: `company/identifier="${companyIdentifier}" and (status/name="Active" or activeFlag=true)`,
            conditions: `company/identifier="${companyIdentifier}" and status/name="Active"`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
    ];

    const origin = req.nextUrl.origin;
    const cookiesHeader = req.headers.get('cookie') || ''; // forward session to the proxy
    const firstRes = await fetch(`${origin}/api/connectwise/system/bundles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookiesHeader ? { cookie: cookiesHeader } : {}) },
      body: JSON.stringify({ requests: firstBundle }),
      cache: 'no-store',
    });

    if (!firstRes.ok) {
      const txt = await firstRes.text().catch(() => '');
      return new NextResponse(`Bundle(agreements+configs) failed ${firstRes.status}\n${txt}`, {
        status: firstRes.status,
      });
    }

    const firstJson = (await firstRes.json()) as BundleResponse;
    const agreements = (firstJson.results.find(r => r.sequenceNumber === 1)?.entities ?? []) as Array<{ id: number }>;
    const configurations = (firstJson.results.find(r => r.sequenceNumber === 2)?.entities ?? []) as any[];

    const agreementIds = agreements.map(a => a?.id).filter((n): n is number => Number.isFinite(n));

    // 3) Bundle #2..N: additions per agreement (cancelledDate=null), chunked
    const additions: any[] = [];
    if (agreementIds.length) {
      const addReqs: BundleRequest[] = agreementIds.map(id => ({
        Version: '2020.1',
        SequenceNumber: id,
        ResourceType: 'addition',
        ApiRequest: {
          parentId: id,
          filters: { conditions: 'cancelledDate=null' },
          page: { page: 1, pageSize: 1000 },
        },
      }));

      for (let i = 0; i < addReqs.length; i += CHUNK) {
        const chunk = addReqs.slice(i, i + CHUNK);
        const r = await fetch(`${origin}/api/connectwise/system/bundles`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...(cookiesHeader ? { cookie: cookiesHeader } : {}) },
          body: JSON.stringify({ requests: chunk }),
          cache: 'no-store',
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => '');
          return new NextResponse(`Bundle(additions) failed ${r.status}\n${txt}`, { status: r.status });
        }
        const j = (await r.json()) as BundleResponse;
        for (const res of j.results || []) {
          if (!res.success || res.statusCode >= 400) continue;
          const arr = Array.isArray(res.entities) ? res.entities : res.data ? [res.data] : [];
          additions.push(...arr);
        }
      }
    }

    // 4) Build the haystack from additions + configurations
    const texts: string[] = [];

    // additions: product.identifier, description, invoiceDescription
    for (const add of additions) {
      const pid = add?.product?.identifier ?? add?.catalogItem?.identifier;
      if (pid) texts.push(lc(pid));
      if (add?.description) texts.push(lc(add.description));
      if (add?.invoiceDescription) texts.push(lc(add.invoiceDescription));
      // manufacturerPartNumber, vendorSku, integrationXRef if you want:
      if (add?.manufacturerPartNumber) texts.push(lc(add.manufacturerPartNumber));
      if (add?.vendorSku) texts.push(lc(add.vendorSku));
      if (add?.integrationXRef) texts.push(lc(add.integrationXRef));
    }

    // configurations: name + type.name
    for (const cfg of configurations) {
      if (cfg?.name) texts.push(lc(cfg.name));
      if (cfg?.type?.name) texts.push(lc(cfg.type.name));
    }

    const haystack = texts.join('\n');

    // 5) Match against catalog
    const matchedSlugs = new Set<string>();
    for (const p of catalog) {
      const terms = (p.matchTerms?.length ? p.matchTerms : [p.name, p.slug]).map(lc);
      for (const t of terms) {
        if (!t || t.length < 2) continue;
        if (haystack.includes(t)) {
          matchedSlugs.add(p.slug);
          break;
        }
      }
    }
    const matched = catalog.filter(p => matchedSlugs.has(p.slug));

    return NextResponse.json({
      matched,
      counts: {
        agreements: agreementIds.length,
        additions: additions.length,
        configurations: configurations.length,
        products: matched.length,
      },
      companyIdentifier,
    });
  } catch (e: any) {
    console.error('GET /api/dashboard/products (bundled) failed:', e);
    return new NextResponse(e?.message || 'Internal error', { status: 500 });
  }
}

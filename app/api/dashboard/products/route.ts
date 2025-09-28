import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { productCatalog, productMatchOverrides } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

/* ---------------- shared helpers ---------------- */
const CHUNK = 50;
const lc = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');
const pushIf = (arr: string[], val?: unknown) => {
  if (typeof val === 'string' && val.trim()) arr.push(lc(val));
};

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ---------------- ConnectWise types ---------------- */
type CwBundleRequest = {
  Version?: string;
  SequenceNumber: number;
  ResourceType: 'agreement' | 'configuration' | 'addition';
  ApiRequest: {
    id?: number;
    parentId?: number;
    grandParentId?: number;
    filters?: {
      conditions?: string;
      orderBy?: string;
      childConditions?: string;
      customFieldConditions?: string;
    };
    page?: { page?: number; pageSize?: number; pageId?: number };
    fields?: string;
    miscProperties?: Record<string, unknown>;
  };
};
type CwBundleResult = {
  sequenceNumber: number;
  resourceType?: string;
  entities?: any[];
  data?: any;
  success: boolean;
  statusCode: number;
  error?: { code?: string; message?: string } | null;
};
type CwBundleResponse = { results: CwBundleResult[] };

/* ---------------- Halo field extraction (best-effort) ---------------- */
/** Collect meaningful text fields from an arbitrary Halo entity */
function collectHaloTexts(entity: any, out: string[]) {
  if (!entity || typeof entity !== 'object') return;

  // Common name-ish fields
  pushIf(out, entity.name);
  pushIf(out, entity.display_name);
  pushIf(out, entity.client_name);
  pushIf(out, entity.site_name);
  pushIf(out, entity.item_name);
  pushIf(out, entity.product_name);
  pushIf(out, entity.contract_name);
  pushIf(out, entity.agreement_name);
  pushIf(out, entity.service_name);
  pushIf(out, entity.asset_name);
  pushIf(out, entity.configuration_name);

  // Identifiers / references / codes
  pushIf(out, entity.reference);
  pushIf(out, entity.ref);
  pushIf(out, entity.id);
  pushIf(out, entity.product_code);
  pushIf(out, entity.item_code);
  pushIf(out, entity.sku);
  pushIf(out, entity.manufacturer);
  pushIf(out, entity.manufacturer_part_number);
  pushIf(out, entity.mpn);
  pushIf(out, entity.vendor_sku);
  pushIf(out, entity.model);
  pushIf(out, entity.type);
  pushIf(out, entity.category);
  pushIf(out, entity.subcategory);

  // Descriptions
  pushIf(out, entity.description);
  pushIf(out, entity.long_description);
  pushIf(out, entity.invoice_description);

  // Nested commonly-used sub-objects (very lenient)
  for (const key of ['item', 'product', 'service', 'asset', 'configuration', 'contract']) {
    if (entity[key] && typeof entity[key] === 'object') collectHaloTexts(entity[key], out);
  }
}

/** Pull a list from Halo API response that might be an array or object with a list property */
function haloList(payload: any, ...listKeys: string[]) {
  if (Array.isArray(payload)) return payload;
  for (const k of listKeys) {
    if (Array.isArray(payload?.[k])) return payload[k];
  }
  // Some Halo endpoints wrap with { record_count, <plural>: [...] }
  const firstArray = Object.values(payload || {}).find(Array.isArray);
  return Array.isArray(firstArray) ? firstArray : [];
}

/* ---------------- main handler ---------------- */
export async function GET(req: NextRequest) {
  try {
    // Frontegg auth
    const session = await getAppSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const feTenantId =
      (session as any)?.tenantId ||
      (session as any)?.user?.tenantId ||
      (session as any)?.tenant?.id ||
      null;

    // Company identifier (query or cookie)
    const sp = req.nextUrl.searchParams;
    const fromQuery = sp.get('companyIdentifier') || sp.get('CompanyIdentifier') || '';
    const fromCookie =
      req.cookies.get('sg.companyIdentifier')?.value ||
      (req.headers.get('cookie')?.match(/(?:^|;\s*)sg\.companyIdentifier=([^;]+)/)?.[1] ?? '');
    const companyIdentifier = fromQuery || fromCookie;
    if (!companyIdentifier) {
      return NextResponse.json(
        { error: 'No company selected. Use the picker, or pass ?companyIdentifier=ACME.' },
        { status: 400 }
      );
    }

    // Catalog
    const catalog = await db
      .select({
        id: productCatalog.id,
        slug: productCatalog.slug,
        name: productCatalog.name,
        vendor: productCatalog.vendor,
        category: productCatalog.category,
        description: productCatalog.description,
        logoLightPath: productCatalog.logoLightPath,
        logoDarkPath: productCatalog.logoDarkPath,
        matchTerms: productCatalog.matchTerms,
        links: productCatalog.links,
      })
      .from(productCatalog);

    // Tenant overrides
    const overridesBySlug = new Map<string, string[]>();
    if (feTenantId) {
      const rows = await db
        .select({
          productSlug: productMatchOverrides.productSlug,
          companyIdentifier: productMatchOverrides.companyIdentifier,
          terms: productMatchOverrides.terms,
        })
        .from(productMatchOverrides)
        .where(
          and(
            eq(productMatchOverrides.feTenantId, feTenantId),
            or(
              isNull(productMatchOverrides.companyIdentifier),
              eq(productMatchOverrides.companyIdentifier as any, ''),
              eq(productMatchOverrides.companyIdentifier, companyIdentifier)
            )
          )
        );

      for (const r of rows) {
        const key = r.productSlug;
        const curr = overridesBySlug.get(key) ?? [];
        const extra = (r.terms ?? []).map((t) => t.toLowerCase()).filter(Boolean);
        overridesBySlug.set(key, unique([...curr, ...extra]));
      }
    }

    // Which PSA?
    const origin = req.nextUrl.origin;
    const cookie = req.headers.get('cookie') || '';
    const psaInfoRes = await fetch(`${origin}/api/psa/info`, {
      headers: { cookie },
      cache: 'no-store',
    });
    if (!psaInfoRes.ok) {
      const txt = await psaInfoRes.text().catch(() => '');
      return NextResponse.json({ error: `psa/info failed: ${txt}` }, { status: 500 });
    }
    const psaInfo = (await psaInfoRes.json()) as { kind: 'connectwise' | 'halo' };

    /* ---------------- build haystack per PSA ---------------- */
    const texts: string[] = [];

    if (psaInfo.kind === 'connectwise') {
      // Agreements + Configurations
      const firstBundle: CwBundleRequest[] = [
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
              conditions: `company/identifier="${companyIdentifier}" and status/name="Active"`,
            },
            page: { page: 1, pageSize: 1000 },
          },
        },
      ];

      const firstRes = await fetch(`${origin}/api/connectwise/system/bundles`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
        body: JSON.stringify({ requests: firstBundle }),
        cache: 'no-store',
      });
      if (!firstRes.ok) {
        const txt = await firstRes.text().catch(() => '');
        return new NextResponse(`Bundle(agreements+configs) failed ${firstRes.status}\n${txt}`, {
          status: firstRes.status,
        });
      }
      const firstJson = (await firstRes.json()) as CwBundleResponse;
      const agreements = (firstJson.results.find((r) => r.sequenceNumber === 1)?.entities ??
        []) as Array<{ id: number }>;
      const configurations = (firstJson.results.find((r) => r.sequenceNumber === 2)?.entities ??
        []) as any[];

      // Extract texts from configurations
      for (const cfg of configurations) {
        pushIf(texts, cfg?.name);
        pushIf(texts, cfg?.type?.name);
      }

      // Additions per agreement
      const agreementIds = agreements
        .map((a) => a?.id)
        .filter((n): n is number => Number.isFinite(n));

      if (agreementIds.length) {
        const addReqs: CwBundleRequest[] = agreementIds.map((id) => ({
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
            headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
            body: JSON.stringify({ requests: chunk }),
            cache: 'no-store',
          });
          if (!r.ok) {
            const txt = await r.text().catch(() => '');
            return new NextResponse(`Bundle(additions) failed ${r.status}\n${txt}`, {
              status: r.status,
            });
          }
          const j = (await r.json()) as CwBundleResponse;
          for (const res of j.results || []) {
            if (!res.success || res.statusCode >= 400) continue;
            const arr = Array.isArray(res.entities) ? res.entities : res.data ? [res.data] : [];
            for (const add of arr) {
              pushIf(texts, add?.product?.identifier ?? add?.catalogItem?.identifier);
              pushIf(texts, add?.description);
              pushIf(texts, add?.invoiceDescription);
              pushIf(texts, add?.manufacturerPartNumber);
              pushIf(texts, add?.vendorSku);
              pushIf(texts, add?.integrationXRef);
            }
          }
        }
      }
} else {
      // HALO (PSA): strictly client-scoped pulls
      const clientIdRaw = companyIdentifier; // in your picker we store Halo "id" as string
      const clientIdNum = Number(clientIdRaw);
      const clientId = Number.isFinite(clientIdNum) ? clientIdNum : clientIdRaw;

      async function pull(url: string) {
        try {
          const r = await fetch(url, { headers: { cookie }, cache: 'no-store' });
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        }
      }

      // Utility: keep only rows that clearly belong to this client
      function filterToClient(rows: any[]): any[] {
        return (rows || []).filter((row) => {
          const cid =
            row?.client_id ??
            row?.clientId ??
            row?.clientID ??
            row?.customer_id ??
            row?.customerId ??
            row?.organisation_id ??
            row?.organization_id ??
            row?.org_id ??
            row?.site_client_id ?? // sometimes nested
            row?.client?.id ??
            row?.customer?.id ??
            row?.organisation?.id;

          // accept both numeric and string ids
          if (cid == null) return false;
          return String(cid) === String(clientId);
        });
      }

      function listFrom(payload: any, ...keys: string[]) {
        if (Array.isArray(payload)) return payload;
        for (const k of keys) {
          if (Array.isArray(payload?.[k])) return payload[k];
        }
        const firstArray = Object.values(payload || {}).find(Array.isArray);
        return Array.isArray(firstArray) ? firstArray : [];
      }

      // 1) Recurring invoice contracts (agreements-like)
      {
        const data = await pull(
          `${origin}/api/halo/RecurringInvoiceContract?client_id=${encodeURIComponent(
            String(clientId)
          )}&pageSize=1000`
        );
        const rows = filterToClient(listFrom(data, 'contracts', 'recurringinvoicecontracts'));
        for (const row of rows) collectHaloTexts(row, texts);
      }

      // 2) Contracts (general)
      {
        const data = await pull(
          `${origin}/api/halo/Contract?client_id=${encodeURIComponent(String(clientId))}&pageSize=1000`
        );
        const rows = filterToClient(listFrom(data, 'contracts'));
        for (const row of rows) collectHaloTexts(row, texts);
      }

      // 3) Assets / configurations
      {
        const data = await pull(
          `${origin}/api/halo/Asset?client_id=${encodeURIComponent(String(clientId))}&pageSize=1000`
        );
        const rows = filterToClient(listFrom(data, 'assets'));
        for (const row of rows) collectHaloTexts(row, texts);
      }

      // ⚠️ Intentionally NOT fetching global Items/Subscriptions here.
      // If you confirm a client-scoped endpoint (e.g. /Client/{id}/Items), add:
      // {
      //   const data = await pull(`${origin}/api/halo/Client/${encodeURIComponent(String(clientId))}/Items?pageSize=1000`);
      //   const rows = filterToClient(listFrom(data, 'items', 'products', 'services'));
      //   for (const row of rows) collectHaloTexts(row, texts);
      // }
    }

    // Build haystack string
    const haystack = texts.join('\n');

    // Match against catalog + overrides
    const matchedSlugs = new Set<string>();
    let overridesConsidered = 0;

    for (const p of catalog) {
      const global = (p.matchTerms?.length ? p.matchTerms : [p.name, p.slug]).map((s) =>
        String(s || '').toLowerCase()
      );
      const extra = overridesBySlug.get(p.slug) ?? [];
      if (extra.length) overridesConsidered += extra.length;

      const terms = unique([...global, ...extra]).filter((t) => t && t.length >= 2);
      if (terms.some((t) => haystack.includes(t))) matchedSlugs.add(p.slug);
    }

    const matched = catalog.filter((p) => matchedSlugs.has(p.slug));

    return NextResponse.json({
      matched,
      counts: {
        products: matched.length,
        overrideTermsConsidered: overridesConsidered,
        productsWithOverrides: Array.from(overridesBySlug.entries()).filter(([, v]) => v.length)
          .length,
        haystackTerms: texts.length,
      },
      companyIdentifier,
      feTenantId: feTenantId ?? undefined,
      psa: psaInfo.kind,
    });
  } catch (e: any) {
    console.error('GET /api/dashboard/products failed:', e);
    return new NextResponse(e?.message || 'Internal error', { status: 500 });
  }
}

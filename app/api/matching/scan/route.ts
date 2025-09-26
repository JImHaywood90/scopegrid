// app/api/matching/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productCatalog, productMatchOverrides } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { and, eq, isNull, or } from 'drizzle-orm';

type BundleRequest = {
  Version?: string;
  SequenceNumber: number;
  ResourceType: 'agreement' | 'configuration' | 'addition';
  ApiRequest: {
    parentId?: number;
    filters?: { conditions?: string };
    page?: { page?: number; pageSize?: number };
  };
};
type BundleResult = {
  sequenceNumber: number;
  success: boolean;
  statusCode: number;
  entities?: any[];
};
type BundleResponse = { results: BundleResult[] };

const CHUNK = 50;
const lc = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');

function extractAdditionTexts(add: any) {
  const out: string[] = [];
  const pid = add?.product?.identifier ?? add?.catalogItem?.identifier;
  if (pid) out.push(lc(pid));
  if (add?.description) out.push(lc(add.description));
  if (add?.invoiceDescription) out.push(lc(add.invoiceDescription));
  if (add?.manufacturerPartNumber) out.push(lc(add.manufacturerPartNumber));
  if (add?.vendorSku) out.push(lc(add.vendorSku));
  if (add?.integrationXRef) out.push(lc(add.integrationXRef));
  return out.filter(Boolean);
}
function extractConfigTexts(cfg: any) {
  const out: string[] = [];
  if (cfg?.name) out.push(lc(cfg.name));
  if (cfg?.type?.name) out.push(lc(cfg.type.name));
  return out.filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    // Auth + team
    const user = await getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'No team' }, { status: 403 });

    // Company identifier (query or cookie)
    const sp = req.nextUrl.searchParams;
    const fromQuery = sp.get('companyIdentifier') || sp.get('CompanyIdentifier') || '';
    const fromCookie = req.cookies.get('sg.companyIdentifier')?.value
      || (req.headers.get('cookie')?.match(/(?:^|;\s*)sg\.companyIdentifier=([^;]+)/)?.[1] ?? '');
    const companyIdentifier = fromQuery || fromCookie;
    if (!companyIdentifier) {
      return NextResponse.json(
        { error: 'Pick a company (?companyIdentifier=ACME).'},
        { status: 400 }
      );
    }

    // Load catalog + team overrides (team-wide + optional per-company)
    const [catalog, overrides] = await Promise.all([
      db.select({
        id: productCatalog.id,
        slug: productCatalog.slug,
        name: productCatalog.name,
        vendor: productCatalog.vendor,
        category: productCatalog.category,
        logoLightPath: productCatalog.logoLightPath,
        logoDarkPath: productCatalog.logoDarkPath,
        matchTerms: productCatalog.matchTerms,
      }).from(productCatalog),

      db.select().from(productMatchOverrides).where(
        and(
          eq(productMatchOverrides.teamId, team.id),
          // load both team-wide (null) and this-company overrides
          or(
            isNull(productMatchOverrides.companyIdentifier),
            eq(productMatchOverrides.companyIdentifier, companyIdentifier)
          )
        )
      ),
    ]);

    // Build terms per product
    const termsBySlug = new Map<string, string[]>();
    for (const p of catalog) {
      termsBySlug.set(p.slug, (p.matchTerms ?? []).map(lc));
    }
    for (const ov of overrides) {
      const curr = termsBySlug.get(ov.productSlug) ?? [];
      const merged = new Set([...curr, ...((ov.terms ?? []).map(lc))]);
      termsBySlug.set(ov.productSlug, Array.from(merged));
    }

    // 1) agreements and configurations (page 1)
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
          filters: { conditions: `company/identifier="${companyIdentifier}" and status/name="Active"` },
          page: { page: 1, pageSize: 1000 },
        },
      },
    ];

    const origin = req.nextUrl.origin;
    const cookiesHeader = req.headers.get('cookie') || '';
    const firstRes = await fetch(`${origin}/api/connectwise/system/bundles`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(cookiesHeader ? { cookie: cookiesHeader } : {}) },
      body: JSON.stringify({ requests: firstBundle }),
      cache: 'no-store',
    });
    if (!firstRes.ok) {
      const txt = await firstRes.text().catch(() => '');
      return new NextResponse(`Bundle failed ${firstRes.status}\n${txt}`, { status: firstRes.status });
    }
    const firstJson = (await firstRes.json()) as BundleResponse;
    const agreements = (firstJson.results.find(r => r.sequenceNumber === 1)?.entities ?? []) as Array<{ id: number; name?: string }>;
    const configurations = (firstJson.results.find(r => r.sequenceNumber === 2)?.entities ?? []) as any[];

    // 2) additions by agreement (non-cancelled)
    const additions: any[] = [];
    const agreementIds = agreements.map(a => a?.id).filter((n): n is number => Number.isFinite(n));
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
        if (!r.ok) continue;
        const j = (await r.json()) as BundleResponse;
        for (const res of j.results || []) {
          if (!res.success || res.statusCode >= 400) continue;
          additions.push(...(res.entities ?? []));
        }
      }
    }

    // 3) Per-item match
    const productsLite = catalog.map(p => ({
      slug: p.slug,
      name: p.name,
      vendor: p.vendor ?? undefined,
      category: p.category ?? undefined,
      logoLightPath: p.logoLightPath,
      logoDarkPath: p.logoDarkPath ?? undefined,
    }));

    const matchedAdditions: any[] = [];
    const unmatchedAdditions: any[] = [];
    for (const add of additions) {
      const texts = extractAdditionTexts(add);
      const hit = productsLite.find(p => {
        const terms = termsBySlug.get(p.slug) ?? [];
        return terms.some(t => t && texts.some(s => s.includes(t)));
      });
      if (hit) matchedAdditions.push({ id: add.id, agreementId: add.agreementId, hit: hit.slug, source: texts[0] ?? '' });
      else unmatchedAdditions.push({
        id: add.id,
        agreementId: add.agreementId,
        productIdentifier: add?.product?.identifier ?? add?.catalogItem?.identifier ?? null,
        description: add?.description ?? null,
        invoiceDescription: add?.invoiceDescription ?? null,
      });
    }

    const matchedConfigs: any[] = [];
    const unmatchedConfigs: any[] = [];
    for (const cfg of configurations) {
      const texts = extractConfigTexts(cfg);
      const hit = productsLite.find(p => {
        const terms = termsBySlug.get(p.slug) ?? [];
        return terms.some(t => t && texts.some(s => s.includes(t)));
      });
      if (hit) matchedConfigs.push({ id: cfg.id, hit: hit.slug, name: cfg.name, typeName: cfg?.type?.name ?? null });
      else unmatchedConfigs.push({ id: cfg.id, name: cfg.name ?? '', typeName: cfg?.type?.name ?? '' });
    }

    return NextResponse.json({
      companyIdentifier,
      products: productsLite,
      counts: {
        agreements: agreementIds.length,
        additions: additions.length,
        configurations: configurations.length,
        matched: matchedAdditions.length + matchedConfigs.length,
        unmatched: unmatchedAdditions.length + unmatchedConfigs.length,
      },
      matched: { additions: matchedAdditions, configurations: matchedConfigs },
      unmatched: { additions: unmatchedAdditions, configurations: unmatchedConfigs },
    });
  } catch (e: any) {
    console.error('GET /api/matching/scan failed:', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: 500 });
  }
}

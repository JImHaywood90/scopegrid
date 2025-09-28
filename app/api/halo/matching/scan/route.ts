// app/api/halo/matching/scan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { productCatalog, productMatchOverrides } from '@/lib/db/schema.v2';
import { and, eq, isNull, or } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

const lc = (s: unknown) => (typeof s === 'string' ? s.toLowerCase() : '');
const arr = <T>(v: T | T[] | undefined | null) => (Array.isArray(v) ? v : v ? [v] : []);

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

/** Pull useful strings from a Halo ContractDetail billing plan row */
function extractDetailTexts(d: any): string[] {
  const out: string[] = [];
  if (d?.plan_name) out.push(lc(d.plan_name));
  if (d?.requesttype_name) out.push(lc(d.requesttype_name));
  // categories often carry product-ish text
  for (const k of ['category_1', 'category_2', 'category_3', 'category_4']) {
    if (d?.[k]) out.push(lc(d[k]));
  }
  if (d?.chargerate_name) out.push(lc(d.chargerate_name));
  return out.filter(Boolean);
}

/** Pull useful strings from a Halo configuration item row (Device_List) */
function extractConfigItemTexts(ci: any): string[] {
  const out: string[] = [];
  // CI structures vary; collect common name-ish fields defensively
  for (const k of ['name', 'devicename', 'hostname', 'model', 'manufacturer', 'vend', 'type_name']) {
    const v = ci?.[k];
    if (typeof v === 'string' && v.trim()) out.push(lc(v));
  }
  return out.filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();

    // companyIdentifier here = Halo client_id (string/number). For UX you can allow a "clientRef"
    // and resolve it to id beforehand; v1 requires client_id directly.
    const sp = req.nextUrl.searchParams;
    const clientId = sp.get('client_id');
    if (!clientId) {
      return NextResponse.json(
        { error: 'Pick a Halo client (?client_id=1234).' },
        { status: 400 }
      );
    }

    // Load global product catalog + tenant overrides (tenant-wide + optional per-company)
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
      db
        .select()
        .from(productMatchOverrides)
        .where(
          and(
            eq(productMatchOverrides.feTenantId, feTenantId),
            or(
              isNull(productMatchOverrides.companyIdentifier),
              eq(productMatchOverrides.companyIdentifier, clientId) // scope per Halo client
            )
          )
        ),
    ]);

    // Build terms per product (catalog terms + overrides)
    const termsBySlug = new Map<string, string[]>();
    for (const p of catalog) termsBySlug.set(p.slug, (p.matchTerms ?? []).map(lc));
    for (const ov of overrides) {
      const curr = termsBySlug.get(ov.productSlug) ?? [];
      const merged = new Set([...curr, ...((ov.terms ?? []).map(lc))]);
      termsBySlug.set(ov.productSlug, Array.from(merged));
    }

    // Products (for UI)
    const productsLite = catalog.map(p => ({
      slug: p.slug,
      name: p.name,
      vendor: p.vendor ?? undefined,
      category: p.category ?? undefined,
      logoLightPath: p.logoLightPath,
      logoDarkPath: p.logoDarkPath ?? undefined,
    }));

    // 1) List contracts for the client
    //    GET /ClientContract?client_id=...  (Halo API)  — returns ContractHeader rows
    //    (We’ll then GET each with includedetails=true to fetch billingplans + configuration_items)
    const origin = req.nextUrl.origin;
    const cookiesHeader = req.headers.get('cookie') || '';

    const listUrl = `${origin}/api/halo/ClientContract?client_id=${encodeURIComponent(
      clientId
    )}&includeinactive=false`;
    const listRes = await fetch(listUrl, {
      headers: { ...(cookiesHeader ? { cookie: cookiesHeader } : {}) },
      cache: 'no-store',
    });
    if (!listRes.ok) {
      const txt = await listRes.text().catch(() => '');
      return new NextResponse(`Halo list contracts failed ${listRes.status}\n${txt}`, {
        status: listRes.status,
      });
    }
    const contracts: any[] = await listRes.json();

    // 2) For each contract, fetch details
    const details: any[] = [];
    for (const c of contracts || []) {
      const id = c?.id ?? c?.contract_id ?? c?.contractheader_id;
      if (!id) continue;

      const detailUrl = `${origin}/api/halo/ClientContract/${id}?includedetails=true`;
      const detRes = await fetch(detailUrl, {
        headers: { ...(cookiesHeader ? { cookie: cookiesHeader } : {}) },
        cache: 'no-store',
      });
      if (!detRes.ok) continue;
      const det = await detRes.json();
      // Expecting properties: billingplans: ContractDetail[], configuration_items: Device_List[]
      details.push({
        id,
        name: det?.name ?? c?.name ?? c?.contract_name ?? `Contract #${id}`,
        billingplans: arr(det?.billingplans),
        configuration_items: arr(det?.configuration_items),
      });
    }

    // 3) Match logic (same strategy as CW): any product whose terms appear in the item texts
    const matchedAdditions: any[] = [];
    const unmatchedAdditions: any[] = [];
    const matchedConfigs: any[] = [];
    const unmatchedConfigs: any[] = [];

    for (const det of details) {
      // additions-like: billingplans (ContractDetail[])
      for (const bp of det.billingplans) {
        const texts = extractDetailTexts(bp);
        const hit = productsLite.find(p => {
          const terms = termsBySlug.get(p.slug) ?? [];
          return terms.some(t => t && texts.some(s => s.includes(t)));
        });
        if (hit) {
          matchedAdditions.push({
            id: bp.seq ?? undefined,
            contractId: det.id,
            contractName: det.name,
            hit: hit.slug,
            source: texts[0] ?? '',
            planName: bp?.plan_name ?? null,
          });
        } else {
          unmatchedAdditions.push({
            id: bp.seq ?? undefined,
            contractId: det.id,
            contractName: det.name,
            planName: bp?.plan_name ?? null,
            categories: [bp?.category_1, bp?.category_2, bp?.category_3, bp?.category_4]
              .filter(Boolean)
              .join(' • ') || null,
          });
        }
      }

      // configurations-like: configuration_items (Device_List[])
      for (const ci of det.configuration_items) {
        const texts = extractConfigItemTexts(ci);
        const hit = productsLite.find(p => {
          const terms = termsBySlug.get(p.slug) ?? [];
          return terms.some(t => t && texts.some(s => s.includes(t)));
        });
        if (hit) {
          matchedConfigs.push({
            id: ci?.id ?? ci?.device_id ?? undefined,
            contractId: det.id,
            contractName: det.name,
            hit: hit.slug,
            name: ci?.name ?? ci?.devicename ?? ci?.hostname ?? null,
          });
        } else {
          unmatchedConfigs.push({
            id: ci?.id ?? ci?.device_id ?? undefined,
            contractId: det.id,
            contractName: det.name,
            name: ci?.name ?? ci?.devicename ?? ci?.hostname ?? '',
            typeName: ci?.type_name ?? ci?.model ?? ci?.manufacturer ?? '',
          });
        }
      }
    }

    // Group by product for the right-hand product cards grid (like your CW page)
    const matchedByProduct: Record<
      string,
      { product: (typeof productsLite)[number]; additions: any[]; configurations: any[] }
    > = {};
    for (const p of productsLite) {
      matchedByProduct[p.slug] = { product: p, additions: [], configurations: [] };
    }
    for (const m of matchedAdditions) matchedByProduct[m.hit]?.additions.push(m);
    for (const m of matchedConfigs) matchedByProduct[m.hit]?.configurations.push(m);

    // Counts
    const agreementsCount = details.length;
    const additionsCount = details.reduce((n, d) => n + d.billingplans.length, 0);
    const configurationsCount = details.reduce((n, d) => n + d.configuration_items.length, 0);

    return NextResponse.json({
      companyIdentifier: String(clientId),
      products: productsLite,
      counts: {
        agreements: agreementsCount,
        additions: additionsCount,
        configurations: configurationsCount,
        matched: matchedAdditions.length + matchedConfigs.length,
        unmatched: unmatchedAdditions.length + unmatchedConfigs.length,
      },
      matched: { additions: matchedAdditions, configurations: matchedConfigs },
      matchedByProduct,
      unmatched: { additions: unmatchedAdditions, configurations: unmatchedConfigs },
    });
  } catch (e: any) {
    console.error('GET /api/halo/matching/scan failed:', e);
    return NextResponse.json({ error: e?.message || 'Internal error' }, { status: e?.status ?? 500 });
  }
}

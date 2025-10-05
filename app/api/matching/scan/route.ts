// app/api/matching/scan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import {
  productCatalog,
  productMatchOverrides,
  productMatchExclusions,
} from "@/lib/db/schema.v2";
import { getAppSession } from "@frontegg/nextjs/app";
import { registerAdapter, getAdapter } from "@/lib/psa/registry";
import { connectwiseAdapter } from "@/lib/psa/adapters/connectwise";
import { haloAdapter } from "@/lib/psa/adapters/halo";
import type { PsaSignal } from "@/lib/psa/types";

const normalize = (v: unknown) =>
  typeof v === "string" ? v.toLowerCase() : v != null ? String(v) : "";

export async function GET(req: NextRequest) {
  try {
    const session = await getAppSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const feTenantId =
      (session as any)?.tenantId ||
      (session as any)?.user?.tenantId ||
      (session as any)?.tenant?.id ||
      null;
    if (!feTenantId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const fromHeader = req.headers.get("x-company-identifier");
    const fromQuery =
      sp.get("companyIdentifier") || sp.get("CompanyIdentifier") || "";
    const fromCookie =
      req.cookies.get("sg.companyIdentifier")?.value ||
      (req.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)sg\.companyIdentifier=([^;]+)/)?.[1] ??
        "");
    const companyIdentifier = fromHeader || fromQuery || fromCookie;

    if (!companyIdentifier) {
      return NextResponse.json(
        {
          error:
            "No company selected. Use the picker, or pass ?companyIdentifier=ACME.",
        },
        { status: 400 }
      );
    }

    const [catalog, overrides, exclusions] = await Promise.all([
      db
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
        .from(productCatalog),
      db
        .select({
          productSlug: productMatchOverrides.productSlug,
          companyIdentifier: productMatchOverrides.companyIdentifier,
          catalogId: productMatchOverrides.catalogId,
          terms: productMatchOverrides.terms,
        })
        .from(productMatchOverrides)
        .where(
          and(
            eq(productMatchOverrides.feTenantId, feTenantId),
            or(
              isNull(productMatchOverrides.companyIdentifier),
              eq(productMatchOverrides.companyIdentifier, companyIdentifier)
            )
          )
        ),
      db
        .select({
          id: productMatchExclusions.id,
          entityType: productMatchExclusions.entityType,
          entityId: productMatchExclusions.entityId,
        })
        .from(productMatchExclusions)
        .where(
          and(
            eq(productMatchExclusions.feTenantId, feTenantId),
            eq(productMatchExclusions.companyIdentifier, companyIdentifier)
          )
        ),
    ]);

    const overrideTerms = new Map<string, string[]>();
    const overrideCatalogIds: Record<string, number> = {};
    for (const row of overrides) {
      const key = row.productSlug;
      const current = overrideTerms.get(key) ?? [];
      const merged = new Set([
        ...current,
        ...((row.terms ?? []).map((t) => normalize(t)).filter(Boolean) as string[]),
      ]);
      overrideTerms.set(key, Array.from(merged));
      if (row.catalogId != null) overrideCatalogIds[key] = Number(row.catalogId);
    }

    const catalogWithOverrides = catalog.map((item) => {
      const extra = overrideTerms.get(item.slug) ?? [];
      const combined = Array.from(new Set([...(item.matchTerms ?? []), ...extra]));
      return { ...item, matchTerms: combined };
    });

    const exclusionMap = exclusions.reduce<Record<string, Set<string>>>(
      (acc, row) => {
        const type = row.entityType ?? "";
        if (!acc[type]) acc[type] = new Set<string>();
        acc[type]!.add(String(row.entityId));
        return acc;
      },
      {}
    );

    const origin = req.nextUrl.origin;
    const cookie = req.headers.get("cookie") || "";
    const psaInfoRes = await fetch(`${origin}/api/psa/info`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!psaInfoRes.ok) {
      const txt = await psaInfoRes.text().catch(() => "");
      return NextResponse.json(
        { error: `psa/info failed: ${txt}` },
        { status: 500 }
      );
    }
    const psaInfo = (await psaInfoRes.json()) as { kind: 'connectwise' | 'halo' };

    registerAdapter(connectwiseAdapter);
    registerAdapter(haloAdapter);

    let signals: PsaSignal[] = [];
    let agreementsCount = 0;
    let additionsCount = 0;
    let configurationsCount = 0;

    if (psaInfo.kind === 'connectwise') {
      const adapter = getAdapter('connectwise');
      if (!adapter) throw new Error('ConnectWise adapter not registered');
      const result = await adapter.fetchCompanyEntities({ origin, cookie, companyIdentifier });
      agreementsCount = Number(result.meta?.agreements ?? 0);
      additionsCount = Number(result.meta?.additions ?? 0);
      configurationsCount = Number(result.meta?.configurations ?? 0);
      signals = adapter.extractSignals(result);
    } else {
      const adapter = getAdapter('halo');
      if (!adapter) throw new Error('Halo adapter not registered');
      const result = await adapter.fetchCompanyEntities({ origin, cookie, companyIdentifier });
      signals = adapter.extractSignals(result);
      agreementsCount = Number(result.meta?.agreements ?? 0);
      additionsCount = Number(result.meta?.additions ?? 0);
      configurationsCount = Number(result.meta?.configurations ?? 0);
    }

    // Filter out excluded entities
    const filteredSignals = signals.filter((sig) => {
      if (!sig) return false;
      const id = String(sig.id);
      const kind = sig.kind ?? '';
      const set = exclusionMap[kind];
      if (set?.has(id)) return false;
      return true;
    });

    const counts = {
      agreements: agreementsCount,
      additions: additionsCount,
      configurations: configurationsCount,
      signals: filteredSignals.length,
      catalog: catalog.length,
    };

    return NextResponse.json({
      companyIdentifier,
      feTenantId,
      psa: psaInfo.kind,
      catalog: catalogWithOverrides,
      overrideTerms: Object.fromEntries(overrideTerms.entries()),
      overrideCatalogIds,
      signals: filteredSignals,
      exclusions,
      counts,
    });
  } catch (e: any) {
    console.error('GET /api/matching/scan failed:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal error' },
      { status: e?.status ?? 500 },
    );
  }
}

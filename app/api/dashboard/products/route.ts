import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { productCatalog, productMatchOverrides } from "@/lib/db/schema.v2";
import { getAppSession } from "@frontegg/nextjs/app";
import { registerAdapter, getAdapter } from "@/lib/psa/registry";
import { connectwiseAdapter } from "@/lib/psa/adapters/connectwise";
import { haloAdapter } from "@/lib/psa/adapters/halo";
import type { PsaSignal } from "@/lib/psa/types";

export const runtime = "nodejs";

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/* ---------------- main handler ---------------- */
// Slimmed route: fetch raw PSA texts and catalog; leave sorting/grouping to client
export async function GET(req: NextRequest) {
  try {
    // Frontegg auth
    const session = await getAppSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const feTenantId =
      (session as any)?.tenantId ||
      (session as any)?.user?.tenantId ||
      (session as any)?.tenant?.id ||
      null;

    // Company identifier (query or cookie)
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

    // Catalog
    const catalogRows = await db
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
    const overrideCatalogIds: Record<string, number> = {};
    if (feTenantId) {
      const rows = await db
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
              eq(productMatchOverrides.companyIdentifier as any, ""),
              eq(productMatchOverrides.companyIdentifier, companyIdentifier)
            )
          )
        );

      for (const r of rows) {
        const key = r.productSlug;
        const curr = overridesBySlug.get(key) ?? [];
        const extra = (r.terms ?? [])
          .map((t) => t.toLowerCase())
          .filter(Boolean);
        overridesBySlug.set(key, unique([...curr, ...extra]));
        if (r.catalogId != null) {
          overrideCatalogIds[key] = Number(r.catalogId);
        }
      }
    }

    const catalog = catalogRows.map((item) => {
      const extra = overridesBySlug.get(item.slug) ?? [];
      const combined = Array.from(new Set([...(item.matchTerms ?? []), ...extra]));
      return { ...item, matchTerms: combined };
    });

    // Which PSA?
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
    const psaInfo = (await psaInfoRes.json()) as {
      kind: "connectwise" | "halo";
    };

    /* ---------------- use PSA adapters to build signals ---------------- */
    registerAdapter(connectwiseAdapter);
    registerAdapter(haloAdapter);
    let signals: PsaSignal[] = [];

    // Track counts for validation
    let agreementsCount = 0;
    let additionsCount = 0;
    let configurationsCount = 0;

    if (psaInfo.kind === "connectwise") {
      const adapter = getAdapter("connectwise");
      if (!adapter) throw new Error("ConnectWise adapter not registered");
      const result = await adapter.fetchCompanyEntities({ origin, cookie, companyIdentifier });
      agreementsCount = Number(result.meta?.agreements ?? 0);
      additionsCount = Number(result.meta?.additions ?? 0);
      configurationsCount = Number(result.meta?.configurations ?? 0);
      signals = adapter.extractSignals(result);
    } else {
      const adapter = getAdapter("halo");
      if (!adapter) throw new Error("Halo adapter not registered");
      const result = await adapter.fetchCompanyEntities({ origin, cookie, companyIdentifier });
      signals = adapter.extractSignals(result);
      agreementsCount = Number(result.meta?.agreements ?? 0);
      additionsCount = Number(result.meta?.additions ?? 0);
      configurationsCount = Number(result.meta?.configurations ?? 0);
    }

    return NextResponse.json({
      catalog,
      overrideTerms: Object.fromEntries(overridesBySlug.entries()),
      overrideCatalogIds,
      signals,
      counts: {
        agreements: agreementsCount,
        additions: additionsCount,
        configurations: configurationsCount,
        signals: signals.length,
        catalog: catalog.length,
      },
      companyIdentifier,
      feTenantId: feTenantId ?? undefined,
      psa: psaInfo.kind,
    });
  } catch (e: any) {
    console.error("GET /api/dashboard/products failed:", e);
    return new NextResponse(e?.message || "Internal error", { status: 500 });
  }
}

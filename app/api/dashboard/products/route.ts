// app/api/dashboard/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { productCatalog, productMatchOverrides } from "@/lib/db/schema";
import { getTeamForUser } from "@/lib/db/queries";

export const runtime = "nodejs";

type BundleRequest = {
  Version?: string;
  SequenceNumber: number;
  ResourceType: "agreement" | "configuration" | "addition";
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
const lc = (s: unknown) => (typeof s === "string" ? s.toLowerCase() : "");

export async function GET(req: NextRequest) {
  try {
    // Resolve company identifier (query param wins, else cookie)
    const sp = req.nextUrl.searchParams;
    const fromQuery =
      sp.get("companyIdentifier") || sp.get("CompanyIdentifier") || "";
    const fromCookie =
      req.cookies.get("sg.companyIdentifier")?.value ||
      (req.headers
        .get("cookie")
        ?.match(/(?:^|;\s*)sg\.companyIdentifier=([^;]+)/)?.[1] ??
        "");
    const companyIdentifier = fromQuery || fromCookie;

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
    const catalog = await db
      .select({
        id: productCatalog.id,
        slug: productCatalog.slug,
        name: productCatalog.name,
        vendor: productCatalog.vendor,
        category: productCatalog.category,
        description: productCatalog.description, // ← NEW
        logoLightPath: productCatalog.logoLightPath,
        logoDarkPath: productCatalog.logoDarkPath,
        matchTerms: productCatalog.matchTerms,
        links: productCatalog.links, // ← NEW
      })
      .from(productCatalog);

    // Team-scoped overrides (team-wide NULL/'' + per-company)
    const team = await getTeamForUser().catch(() => null);
    const overridesBySlug = new Map<string, string[]>();

    if (team) {
      const rows = await db
        .select({
          productSlug: productMatchOverrides.productSlug,
          companyIdentifier: productMatchOverrides.companyIdentifier,
          terms: productMatchOverrides.terms,
        })
        .from(productMatchOverrides)
        .where(
          and(
            eq(productMatchOverrides.teamId, team.id),
            or(
              isNull(productMatchOverrides.companyIdentifier),
              eq(productMatchOverrides.companyIdentifier, "" as any),
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
        overridesBySlug.set(key, Array.from(new Set([...curr, ...extra])));
      }
    }

    // Bundle #1: agreements + configurations
    const firstBundle: BundleRequest[] = [
      {
        Version: "2020.1",
        SequenceNumber: 1,
        ResourceType: "agreement",
        ApiRequest: {
          filters: {
            conditions: `company/identifier="${companyIdentifier}" and agreementStatus="Active" and cancelledFlag=false`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
      {
        Version: "2020.1",
        SequenceNumber: 2,
        ResourceType: "configuration",
        ApiRequest: {
          filters: {
            conditions: `company/identifier="${companyIdentifier}" and status/name="Active"`,
          },
          page: { page: 1, pageSize: 1000 },
        },
      },
    ];

    const origin = req.nextUrl.origin;
    const cookiesHeader = req.headers.get("cookie") || "";

    const firstRes = await fetch(`${origin}/api/connectwise/system/bundles`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookiesHeader ? { cookie: cookiesHeader } : {}),
      },
      body: JSON.stringify({ requests: firstBundle }),
      cache: "no-store",
    });

    if (!firstRes.ok) {
      const txt = await firstRes.text().catch(() => "");
      return new NextResponse(
        `Bundle(agreements+configs) failed ${firstRes.status}\n${txt}`,
        {
          status: firstRes.status,
        }
      );
    }

    const firstJson = (await firstRes.json()) as BundleResponse;
    const agreements = (firstJson.results.find((r) => r.sequenceNumber === 1)
      ?.entities ?? []) as Array<{ id: number }>;
    const configurations = (firstJson.results.find(
      (r) => r.sequenceNumber === 2
    )?.entities ?? []) as any[];

    const agreementIds = agreements
      .map((a) => a?.id)
      .filter((n): n is number => Number.isFinite(n));

    // Bundle #2..N: additions per agreement (chunked)
    const additions: any[] = [];
    if (agreementIds.length) {
      const addReqs: BundleRequest[] = agreementIds.map((id) => ({
        Version: "2020.1",
        SequenceNumber: id,
        ResourceType: "addition",
        ApiRequest: {
          parentId: id,
          filters: { conditions: "cancelledDate=null" },
          page: { page: 1, pageSize: 1000 },
        },
      }));

      for (let i = 0; i < addReqs.length; i += CHUNK) {
        const chunk = addReqs.slice(i, i + CHUNK);
        const r = await fetch(`${origin}/api/connectwise/system/bundles`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(cookiesHeader ? { cookie: cookiesHeader } : {}),
          },
          body: JSON.stringify({ requests: chunk }),
          cache: "no-store",
        });
        if (!r.ok) {
          const txt = await r.text().catch(() => "");
          return new NextResponse(
            `Bundle(additions) failed ${r.status}\n${txt}`,
            { status: r.status }
          );
        }
        const j = (await r.json()) as BundleResponse;
        for (const res of j.results || []) {
          if (!res.success || res.statusCode >= 400) continue;
          const arr = Array.isArray(res.entities)
            ? res.entities
            : res.data
            ? [res.data]
            : [];
          additions.push(...arr);
        }
      }
    }

    // Build haystack
    const texts: string[] = [];
    for (const add of additions) {
      const pid = add?.product?.identifier ?? add?.catalogItem?.identifier;
      if (pid) texts.push(lc(pid));
      if (add?.description) texts.push(lc(add.description));
      if (add?.invoiceDescription) texts.push(lc(add.invoiceDescription));
      if (add?.manufacturerPartNumber)
        texts.push(lc(add.manufacturerPartNumber));
      if (add?.vendorSku) texts.push(lc(add.vendorSku));
      if (add?.integrationXRef) texts.push(lc(add.integrationXRef));
    }
    for (const cfg of configurations) {
      if (cfg?.name) texts.push(lc(cfg.name));
      if (cfg?.type?.name) texts.push(lc(cfg.type.name));
    }
    const haystack = texts.join("\n");

    // Match (catalog + overrides)
    const matchedSlugs = new Set<string>();
    let overridesConsidered = 0;

    for (const p of catalog) {
      const global = (
        p.matchTerms?.length ? p.matchTerms : [p.name, p.slug]
      ).map((s) => s.toLowerCase());
      const extra = overridesBySlug.get(p.slug) ?? [];
      if (extra.length) overridesConsidered += extra.length;

      const terms = Array.from(new Set([...global, ...extra]));
      if (terms.some((t) => t && t.length >= 2 && haystack.includes(t))) {
        matchedSlugs.add(p.slug);
      }
    }

    const matched = catalog.filter((p) => matchedSlugs.has(p.slug));

    return NextResponse.json({
      matched,
      counts: {
        agreements: agreementIds.length,
        additions: additions.length,
        configurations: configurations.length,
        products: matched.length,
        overrideTermsConsidered: overridesConsidered,
        productsWithOverrides: Array.from(overridesBySlug.entries()).filter(
          ([, v]) => v.length
        ).length,
      },
      companyIdentifier,
    });
  } catch (e: any) {
    console.error("GET /api/dashboard/products (bundled) failed:", e);
    return new NextResponse(e?.message || "Internal error", { status: 500 });
  }
}

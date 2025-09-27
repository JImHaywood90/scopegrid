"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import CompanyPicker from "@/components/ConnectWise/company-picker";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";

type MatchedProduct = {
  id: number;
  slug: string;
  name: string;
  vendor?: string | null;
  category?: string | null;
  description?: string | null; // ← NEW
  logoLightPath: string;
  logoDarkPath?: string | null; // ← NEW
  links?: Record<string, string> | null; // ← NEW
};

const fetcher = async (u: string) => {
  const r = await fetch(u);
  const text = await r.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!r.ok) {
    const err: any = new Error(json?.error || text || "Request failed");
    err.status = r.status;
    throw err;
  }
  return json ?? {};
};

export default function DashboardProducts() {
  const sp = useSearchParams();
  const companyParam =
    sp?.get("CompanyIdentifier") ?? sp?.get("companyIdentifier") ?? null;

  const q = (sp?.get("q") ?? "").toLowerCase();
  const cat = sp?.get("cat") ?? "";

  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    matched: MatchedProduct[];
    count: number;
    companyIdentifier?: string;
  }>("/api/dashboard/products", fetcher);

  // If URL contains ?CompanyIdentifier=..., set cookie then refresh
  useEffect(() => {
    if (!companyParam) return;
    (async () => {
      await fetch("/api/dashboard/company-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: companyParam, name: companyParam }),
      });
      await mutate();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyParam]);

  const items = data?.matched ?? [];

  // Apply search + category filters client-side
  const filtered = useMemo(() => {
    return items.filter((p) => {
      const inCat = !cat || (p.category ?? "") === cat;
      const hay = `${p.name} ${p.vendor ?? ""} ${
        p.category ?? ""
      }`.toLowerCase();
      const hits = !q || hay.includes(q);
      return inCat && hits;
    });
  }, [items, q, cat]);

  const showSkeletons = isLoading || isValidating;

  return (
    <section className="flex-1 p-4 lg:p-8">
      {/* Keep a compact picker on mobile; main controls live in the header */}
      <div className="mb-4 md:hidden">
        <CompanyPicker onChanged={() => mutate()} />
      </div>

      {error ? (
        error.status === 400 ? (
          <div className="text-sm text-muted-foreground">
            Pick a company to view products.
          </div>
        ) : (
          <div className="text-red-600">Failed to load products.</div>
        )
      ) : showSkeletons ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              logoLightPath={p.logoLightPath}
              logoDarkPath={p.logoDarkPath || undefined}
              description={p.description || undefined}
              links={p.links || undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}

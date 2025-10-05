"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";
import CompanyPicker from "@/components/ConnectWise/company-picker";
import ProductCard from "@/components/products/ProductCard";
import ProductCardSkeleton from "@/components/products/ProductCardSkeleton";
import DomainCard from "@/components/domains/DomainCard";
import { probeBackupRadarPresence } from "@/lib/backupRadarProbe";
import BackupRadarCard from "@/components/backupradar/BackupRadarCard";
import { MerakiCard } from "@/components/meraki/MerakiCard";
import { SmilebackCard } from "@/components/smileback/SmilebackCard";
import { CippCard } from "@/components/cipp/CippCard";
import { useCompanyContext } from "@/contexts/CompanyContext";
import { MatchingProvider } from "@/contexts/MatchingContext";
import { useMatching } from "@/hooks/useMatching";
import { AuvikCard } from "@/components/auvik/AuvikCard";

type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  vendor?: string | null;
  category?: string | null;
  description?: string | null;
  logoLightPath: string;
  logoDarkPath?: string | null;
  links?: Record<string, string> | null;
  matchTerms?: string[] | null;
};

type CatalogSignal = {
  id: string | number;
  name: string;
  terms?: string[];
  kind?: string;
  meta?: Record<string, unknown>;
};

export default function DashboardProducts() {
  const sp = useSearchParams();
  const urlCompanyParam =
    sp?.get("CompanyIdentifier") ?? sp?.get("companyIdentifier") ?? null;

  const q = (sp?.get("q") ?? "").toLowerCase();
  const cat = sp?.get("cat") ?? "";

  const { identifier, name, backupRadar, setCompanyContext } =
    useCompanyContext();

      const fetcher = async (url: string) => {
    const res = await fetch(url, {
      headers: {
        "x-company-identifier": identifier ?? "",
      },
    });

    const text = await res.text();
    let json: any = null;

    try {
      json = JSON.parse(text);
    } catch {}

    if (!res.ok) {
      const err: any = new Error(json?.error || text || "Request failed");
      err.status = res.status;
      throw err;
    }

    return json ?? {};
  };

  // Pull raw product data for client-side matching
  const { data, error, isLoading, isValidating } = useSWR<{
    catalog: CatalogProduct[];
    overrideTerms: Record<string, string[]>;
    signals: CatalogSignal[];
    overrideCatalogIds: Record<string, string | number>;
  }>(identifier ? ["/api/dashboard/products", identifier] : null, ([url]) => fetcher(url));

  // On mount, if URL contains a ?CompanyIdentifier, populate context
  useEffect(() => {
    if (!urlCompanyParam || identifier) return;
    setCompanyContext({ identifier: urlCompanyParam, name: urlCompanyParam });
  }, [urlCompanyParam, identifier, setCompanyContext]);

  // Run BackupRadar probe if we have a company identifier
  const lastProbedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!identifier || !name) return;

    const key = `${identifier}:${name}`;
    if (lastProbedRef.current === key) return;

    lastProbedRef.current = key;

    console.log("Probing BackupRadar for", name);
    probeBackupRadarPresence(name).then((res) => {
      console.log("BackupRadar probe result:", res.hasResults);
      setCompanyContext({ backupRadar: { hasResults: res.hasResults } });
    });
  }, [identifier, name, setCompanyContext]);

  // Derive matched catalog set using MatchingProvider + useMatching
  type GroupedMatch = {
    catalog: CatalogProduct;
    signals: CatalogSignal[];
  };

  function MatchedCatalogList({ children }: { children: (matched: GroupedMatch[]) => React.ReactNode }) {
    const { matched } = useMatching<CatalogSignal, CatalogProduct>({ slugToId: data?.overrideCatalogIds ?? {} });
    const list = useMemo<GroupedMatch[]>(() => {
      const map = new Map<number | string, GroupedMatch>();
      for (const entry of matched) {
        const catalog = entry.catalog as CatalogProduct;
        const signal = entry.product as CatalogSignal;
        const key = catalog.id ?? catalog.slug ?? catalog.name;
        if (!map.has(key)) {
          map.set(key, { catalog, signals: [] });
        }
        map.get(key)!.signals.push(signal);
      }
      return Array.from(map.values());
    }, [matched]);
    return <>{children(list)}</>;
  }

  const isDomainProduct = (product: CatalogProduct) => {
    const slug = (product.slug ?? '').toLowerCase();
    const name = product.name.toLowerCase();
    return slug.includes('domain') || name.includes('domain');
  };

  // Filtering is applied within the MatchedCatalogList render callback using current matched items

  const showSkeletons = isLoading || isValidating;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <section className="flex-1 p-4 lg:p-8">
        {/* Compact company picker for mobile */}
        <div className="mb-4 md:hidden">
          <CompanyPicker onChanged={() => {}} />
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
        ) : (
          <MatchingProvider
            products={(data?.signals ?? []).map((s) => ({ id: s.id, name: s.name, terms: s.terms, kind: s.kind, meta: s.meta }))}
            catalog={(data?.catalog ?? []) as any}
            initialOverrides={{}}
            initialExclusions={new Set<string>()}
          >
            <MatchedCatalogList>
              {(groups) => {
                const filtered = groups.filter(({ catalog }) => {
                  const inCat = !cat || (catalog.category ?? "") === cat;
                  const hay = `${catalog.name} ${catalog.vendor ?? ""} ${catalog.category ?? ""}`.toLowerCase();
                  const hits = !q || hay.includes(q);
                  return inCat && hits;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-sm text-muted-foreground">No products match your filters.</div>
                  );
                }

                const productCards = (() => {
                  let hasMerakiMatch = false;
                  let hasAuvikMatch = false;

                  const cards = filtered.map(({ catalog: product, signals }) => {
                    if (isDomainProduct(product)) {
                      const domains = extractDomainsFromSignals(signals);
                      return (
                        <DomainCard
                          key={product.slug || product.id}
                          catalog={product}
                          domains={domains}
                        />
                      );
                    }

                    const slug = (product.slug ?? '').toLowerCase();
                    if (slug === 'microsoft-365') {
                      return null;
                    }
                    if (slug === 'meraki') {
                      hasMerakiMatch = true;
                      return null;
                    }
                    if (slug === 'auvik') {
                      hasAuvikMatch = true;
                      return null;
                    }

                    return (
                      <ProductCard
                        key={product.slug || product.id}
                        id={product.id}
                        name={product.name}
                        logoLightPath={product.logoLightPath}
                        logoDarkPath={product.logoDarkPath || undefined}
                        description={product.description || undefined}
                        links={product.links || undefined}
                      />
                    );
                  });

                  if (hasMerakiMatch && identifier) {
                    cards.push(
                      <MerakiCard
                        key="custom-meraki-card"
                        companyIdentifier={identifier}
                        companyName={name ?? undefined}
                      />
                    );
                  }

                  if (hasAuvikMatch && identifier) {
                    cards.push(
                      <AuvikCard
                        key="custom-auvik-card"
                        companyIdentifier={identifier}
                        companyName={name ?? undefined}
                      />
                    );
                  }

                  if (identifier) {
                    cards.push(
                      <CippCard
                        key="custom-cipp-card"
                        companyIdentifier={identifier}
                        companyName={name ?? undefined}
                      />
                    );
                  }

                  if (name) {
                    cards.push(<SmilebackCard key="custom-smileback-card" companyName={name} />);
                  }

                  if (backupRadar?.hasResults && name) {
                    cards.push(<BackupRadarCard key="custom-backup-card" companyName={name} />);
                  }

                  return cards;
                })();

                return (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {productCards}
                  </div>
                );
              }}
            </MatchedCatalogList>
          </MatchingProvider>
        )}
      </section>
    </Suspense>
  );
}

const DOMAIN_REGEX = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,})\b/gi;

function extractDomainsFromSignals(signals: CatalogSignal[]): string[] {
  const set = new Set<string>();

  const addFromText = (text?: string | null) => {
    if (!text) return;
    const matches = text.toLowerCase().match(DOMAIN_REGEX);
    if (!matches) return;
    matches.forEach((domain) => {
      const normalized = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
      if (normalized) set.add(normalized);
    });
  };

  for (const signal of signals) {
    addFromText(signal.name);
    (signal.terms ?? []).forEach(addFromText);
    const meta = signal.meta ?? {};
    Object.values(meta).forEach((value) => {
      if (typeof value === 'string') addFromText(value);
    });
  }

  return Array.from(set).sort();
}

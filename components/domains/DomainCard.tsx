"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ThemedImage from "@/components/media/ThemedImage";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DomainDialog } from "./DomainDialog";

export type DomainDnsResult = {
  ARecord: string;
  SPF: string[];
  DMARC: string[];
  DKIM: string[];
  NS: string[] | string;
  EmailProvider: string;
  Domain: string;
  error?: string;
};

type DomainCheckResponse = {
  results: Record<string, DomainDnsResult>;
};

export interface DomainCardProps {
  catalog: {
    id: number;
    slug: string;
    name: string;
    description?: string | null;
    logoLightPath: string;
    logoDarkPath?: string | null;
  };
  domains: string[];
}

async function fetchDomainChecks(domains: string[]): Promise<Record<string, DomainDnsResult>> {
  const res = await fetch("/api/domains/check-batch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ domains }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Domain lookup failed");
  }

  const json = (await res.json()) as DomainCheckResponse;
  return json.results ?? {};
}

export const hasRecord = (values?: string[] | string): boolean => {
  if (!values) return false;
  if (Array.isArray(values)) {
    return values.some((v) => v && v !== "No record found");
  }
  return values !== "No record found";
};

export type SummaryItem = {
  domain: string;
  result?: DomainDnsResult;
  tone: "good" | "warn" | "bad" | "pending";
  statusLabel: string;
};

export default function DomainCard({ catalog, domains }: DomainCardProps) {
  const sortedDomains = React.useMemo(
    () => Array.from(new Set(domains.map((d) => d.toLowerCase()))).sort(),
    [domains]
  );

  const { data, error, isLoading } = useSWR(
    sortedDomains.length ? ["domain-check", sortedDomains.join(",")] : null,
    () => fetchDomainChecks(sortedDomains),
    {
      revalidateOnFocus: false,
    }
  );

  const results = data ?? {};

  const summaryItems = React.useMemo<SummaryItem[]>(() => {
    return sortedDomains.map((domain) => {
      const result = results[domain];
      return {
        domain,
        result,
        ...deriveStatusTone(result, !!error),
      } as SummaryItem;
    });
  }, [sortedDomains, results, error]);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedDomain, setSelectedDomain] = React.useState<string | null>(null);

  const openDetails = React.useCallback(
    (domain: string) => {
      setSelectedDomain(domain);
      setDialogOpen(true);
    },
    []
  );

  const cardBody = React.useMemo(() => {
    if (isLoading) {
      const skeletonCount = sortedDomains.length ? Math.min(sortedDomains.length, 6) : 3;
      return (
        <div className="space-y-2">
          {Array.from({ length: skeletonCount }).map((_, idx) => (
            <Skeleton key={`domain-skeleton-${idx}`} className="h-12 w-full" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Failed to check domains. {String(error)}
        </div>
      );
    }

    if (summaryItems.length === 0) {
      return <div className="text-sm text-muted-foreground">No domains detected yet.</div>;
    }

    return (
      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
        {summaryItems.map((item) => (
          <button
            key={item.domain}
            type="button"
            onClick={() => openDetails(item.domain)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors border shadow-sm',
              toneClasses[item.tone]
            )}
          >
            {item.domain}
            <span className="ml-2 text-[10px] uppercase tracking-wide">{item.statusLabel}</span>
          </button>
        ))}
      </div>
    );
  }, [error, isLoading, openDetails, summaryItems, sortedDomains.length]);

  return (
    <>
      <Card
        className="flex flex-col min-h-[220px] rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/85 dark:bg-slate-900/70 backdrop-blur-sm"
      >
        <CardHeader className="flex flex-row items-center gap-3">
          <ThemedImage
            light={catalog.logoLightPath}
            dark={catalog.logoDarkPath || catalog.logoLightPath}
            alt={catalog.name}
            width={32}
            height={32}
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{catalog.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              Monitoring {summaryItems.length} domain{summaryItems.length === 1 ? '' : 's'}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {cardBody}
        </CardContent>
      </Card>

      <DomainDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        summaryItems={summaryItems}
        results={results}
        initialDomain={selectedDomain ?? summaryItems[0]?.domain ?? null}
        loading={isLoading}
        error={error instanceof Error ? error.message : error ? String(error) : null}
      />
    </>
  );
}

function deriveStatusTone(result?: DomainDnsResult, hasError?: boolean) {
  if (hasError) {
    return { tone: "bad" as const, statusLabel: "Error" };
  }

  if (!result) {
    return { tone: "pending" as const, statusLabel: "Pending" };
  }

  if (result.error) {
    return { tone: "bad" as const, statusLabel: "Error" };
  }

  const present = [hasRecord(result.SPF), hasRecord(result.DMARC), hasRecord(result.DKIM)];
  const positive = present.filter(Boolean).length;

  if (positive === 3) return { tone: "good" as const, statusLabel: "Healthy" };
  if (positive > 0) return { tone: "warn" as const, statusLabel: "Needs attention" };
  return { tone: "bad" as const, statusLabel: "Missing" };
}

const toneClasses: Record<"good" | "warn" | "bad" | "pending", string> = {
  good:
    'bg-emerald-500/15 text-emerald-700 border border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-50 dark:border-emerald-400/60',
  warn:
    'bg-amber-400/15 text-amber-700 border border-amber-400/40 dark:bg-amber-400/20 dark:text-amber-50 dark:border-amber-300/60',
  bad:
    'bg-destructive/10 text-destructive border border-destructive/40 dark:bg-destructive/25 dark:text-destructive-foreground dark:border-destructive/50',
  pending:
    'bg-slate-200/70 text-slate-600 border border-slate-300/60 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-700/60',
};

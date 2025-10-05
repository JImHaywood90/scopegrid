"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { SmilebackDialog } from "@/components/smileback/SmilebackDialog";
import type { SmilebackSummary } from "@/components/smileback/types";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const err: any = new Error(parsed?.error || text || "Request failed");
    err.status = res.status;
    throw err;
  }
  return parsed ?? null;
};

type Props = {
  companyName?: string | null;
};

export function SmilebackCard({ companyName }: Props) {
  const shouldLoad = !!companyName;
  const query = companyName
    ? `/api/smileback/summary?${new URLSearchParams({ companyName }).toString()}`
    : null;
  const { data, error, isLoading } = useSWR<SmilebackSummary>(query, fetcher, {
    revalidateOnFocus: false,
  });
  const [open, setOpen] = useState(false);

  if (!shouldLoad) return null;

  const hasData = !!data && data.totalResponses > 0;
  const totals = data?.counts ?? { positive: 0, neutral: 0, negative: 0, unknown: 0 };
  const score = data?.score ?? null;
  const responses = data?.totalResponses ?? 0;
  const disabled = !hasData || !!error;

  return (
    <>
      <Card
        onClick={() => {
          if (!disabled) setOpen(true);
        }}
        className="group h-full cursor-pointer rounded-2xl border border-slate-200/70 bg-white/85 backdrop-blur-sm transition-all hover:border-slate-300/70 hover:shadow-md hover:ring-1 hover:ring-slate-200/60 dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-slate-600/70 dark:hover:ring-slate-500/50"
        aria-disabled={disabled}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium text-foreground">SmileBack</CardTitle>
          {companyName ? (
            <span className="text-xs text-muted-foreground truncate max-w-[160px] text-right">
              {companyName}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-rose-600">
              {error?.message || "Unable to load SmileBack summary."}
            </div>
          ) : !hasData ? (
            <div className="text-sm text-muted-foreground">
              No SmileBack reviews found for this company yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                <Kpi
                  label="CSAT"
                  value={score != null ? `${score}%` : '—'}
                  align="center"
                  fontSize={28}
                  color={score != null && score >= 90 ? '#16a34a' : score != null && score >= 70 ? '#f59e0b' : '#dc2626'}
                />
                <Kpi label="Responses" value={responses} align="center" fontSize={28} />
                <Kpi label="Positive" value={totals.positive} align="center" fontSize={28} color="#16a34a" />
                <Kpi label="Negative" value={totals.negative} align="center" fontSize={28} color="#dc2626" />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {responses} {responses === 1 ? 'response' : 'responses'} tracked
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!disabled) setOpen(true);
                  }}
                  disabled={disabled}
                >
                  View details
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SmilebackDialog open={open} setOpen={setOpen} summary={data} loading={!!isLoading} error={error} />
    </>
  );
}

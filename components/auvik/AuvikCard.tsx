"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Kpi } from "@/components/ui/kpi";
import { AuvikDialog } from "@/components/auvik/AuvikDialog";
import type { AuvikSummary } from "@/components/auvik/types";

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
  return parsed as AuvikSummary;
};

type Props = {
  companyIdentifier: string;
  companyName?: string | null;
};

export function AuvikCard({ companyIdentifier, companyName }: Props) {
  const [open, setOpen] = useState(false);
  const query = `/api/auvik/summary?companyIdentifier=${encodeURIComponent(companyIdentifier)}${
    companyName ? `&companyName=${encodeURIComponent(companyName)}` : ''
  }`;
  const { data, error, isLoading } = useSWR<AuvikSummary>(query, fetcher, {
    revalidateOnFocus: false,
  });

  const hasData = !!data;
  const deviceCounts = data?.devices.statusCounts;
  const alerts = data?.alerts;
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
          <CardTitle className="text-base font-medium text-foreground">
            Auvik
          </CardTitle>
          {companyName ? (
            <span className="max-w-[160px] truncate text-xs text-muted-foreground text-right">
              {companyName}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error ? (
            <div className="text-sm text-rose-600">
              {error?.message || "Unable to load Auvik summary."}
            </div>
          ) : !data ? (
            <div className="text-sm text-muted-foreground">
              No Auvik data available yet.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                <Kpi label="Devices" value={data.devices.total} align="center" fontSize={28} />
                <Kpi label="Online" value={deviceCounts?.online ?? 0} align="center" fontSize={28} color="#16a34a" />
                <Kpi label="Offline" value={deviceCounts?.offline ?? 0} align="center" fontSize={28} color="#dc2626" />
                <Kpi
                  label="Alerts"
                  value={alerts?.total ?? 0}
                  align="center"
                  fontSize={28}
                  color={alerts && alerts.total > 0 ? '#f97316' : undefined}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {data.site?.name
                    ? `Site: ${data.site.name}`
                    : `Monitoring ${data.devices.total} device${data.devices.total === 1 ? '' : 's'}`}
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

      <AuvikDialog open={open} setOpen={setOpen} summary={data ?? null} loading={isLoading} error={error} />
    </>
  );
}

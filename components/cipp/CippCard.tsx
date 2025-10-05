"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CippDialog } from "@/components/cipp/CippDialog";
import type { CippSummary } from "@/components/cipp/types";
import { useCompanyContext } from "@/contexts/CompanyContext";

type TenantLookup = {
  tenantId: string | null;
  primaryDomain: string | null;
  candidates: Array<{ domain: string; count: number }>;
  emailsAnalyzed: number;
};

const summaryFetcher = async (url: string) => {
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
  return parsed as CippSummary;
};

type Props = {
  companyIdentifier?: string | null;
  companyName?: string | null;
};

const tenantFetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const err: any = new Error(parsed?.error || text || "Tenant lookup failed");
    err.status = res.status;
    throw err;
  }
  return parsed as TenantLookup;
};

export function CippCard({ companyIdentifier, companyName }: Props) {
  const { tenantId: contextTenantId, setCompanyContext } = useCompanyContext();
  const [open, setOpen] = useState(false);

  const tenantKey = useMemo(() => {
    if (contextTenantId) return null;
    if (!companyIdentifier) return null;
    return `/api/cipp/tenant?companyIdentifier=${encodeURIComponent(companyIdentifier)}`;
  }, [companyIdentifier, contextTenantId]);

  const {
    data: tenantLookup,
    error: tenantError,
    isLoading: tenantLoading,
  } = useSWR<TenantLookup>(tenantKey, tenantFetcher, { revalidateOnFocus: false });

  const effectiveTenantId = useMemo(() => {
    if (contextTenantId) return contextTenantId;
    return tenantLookup?.tenantId ?? null;
  }, [contextTenantId, tenantLookup?.tenantId]);

  useEffect(() => {
    if (tenantLookup?.tenantId && tenantLookup.tenantId !== contextTenantId) {
      setCompanyContext({ tenantId: tenantLookup.tenantId });
    }
  }, [tenantLookup?.tenantId, contextTenantId, setCompanyContext]);

  const summaryKey = effectiveTenantId
    ? `/api/cipp/summary?tenantId=${encodeURIComponent(effectiveTenantId)}`
    : null;

  const {
    data,
    error: summaryError,
    isLoading: summaryLoading,
  } = useSWR<CippSummary>(summaryKey, summaryFetcher, {
    revalidateOnFocus: false,
  });

  const overallLoading = tenantLoading || summaryLoading;
  const tenantErrorMessage = tenantError
    ? typeof tenantError === 'string'
      ? tenantError
      : tenantError?.message || String(tenantError)
    : null;
  const summaryErrorMessage = summaryError
    ? summaryError?.message || String(summaryError)
    : null;
  const errorMessage = summaryErrorMessage || tenantErrorMessage;

  const hasTenant = !!effectiveTenantId;
  const hasData = !!data;
  const users = data?.users;
  const secure = data?.secureScore;
  const totalUsers = users?.total ?? null;
  const licensedUsers = users?.licensed ?? null;
  const securePercent = secure?.percent;

  if (!hasTenant && !tenantLoading) {
    return (
      <Card className="group h-full rounded-2xl border border-slate-200/70 bg-white/85 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium text-foreground">
            CIPP
          </CardTitle>
          {companyName ? (
            <span className="max-w-[160px] truncate text-xs text-muted-foreground text-right">
              {companyName}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {tenantErrorMessage ? (
            <div className="text-sm text-rose-600">{tenantErrorMessage}</div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Unable to detect this tenant's Microsoft 365 domain yet.
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const disabled = !hasData || !!summaryErrorMessage;

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
            CIPP
          </CardTitle>
          {companyName ? (
            <span className="max-w-[160px] truncate text-xs text-muted-foreground text-right">
              {companyName}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {overallLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : errorMessage ? (
            <div className="text-sm text-rose-600">{errorMessage}</div>
          ) : !data ? (
            <div className="text-sm text-muted-foreground">No CIPP data available yet.</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                <Kpi label="Users" value={totalUsers ?? '—'} align="center" fontSize={28} />
                <Kpi label="Licensed" value={licensedUsers ?? '—'} align="center" fontSize={28} />
                <Kpi
                  label="Secure Score"
                  value={securePercent != null ? `${securePercent}%` : '—'}
                  align="center"
                  fontSize={28}
                  color={
                    securePercent != null
                      ? securePercent >= 80
                        ? '#16a34a'
                        : securePercent >= 60
                        ? '#f59e0b'
                        : '#dc2626'
                      : undefined
                  }
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {licensedUsers != null && totalUsers != null
                    ? `${licensedUsers}/${totalUsers} licensed`
                    : 'Tenant summary'}
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

      <CippDialog
        open={open}
        setOpen={setOpen}
        summary={data ?? null}
        loading={overallLoading}
        error={summaryError as any}
      />
    </>
  );
}

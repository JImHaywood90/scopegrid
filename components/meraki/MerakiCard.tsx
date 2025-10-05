"use client";

import * as React from "react";
import useSWR from "swr";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Kpi } from "@/components/ui/kpi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { MerakiDialog } from "@/components/meraki/MerakiDialog";

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

export type SummaryItem = {
  merakiOrgId: string;
  merakiOrgName: string;
  companyIdentifier: string;
  companyName?: string | null;
  networkCount: number;
  totalDevices: number;
  devices?: {
    name: string;
    model: string;
    status: string;
    mac: string;
    serial: string;
  }[];
  networks?: {
    id: string;
    name: string;
    timeZone: string;
    tags: string[];
  }[];
  deviceCounts: {
    online: number;
    offline: number;
    alerting: number;
    dormant: number;
    other: number;
  };
  licenseStatus: string | null;
  licenseExpiration: string | null;
  licenseExpiresInDays: number | null;
  errors: string[];
};

export type SummaryResponse = {
  companyIdentifier: string;
  items: SummaryItem[];
  totals: {
    organizations: number;
    devices: number;
    offlineDevices: number;
    alertingDevices: number;
    networks: number;
  };
};

type Props = {
  companyIdentifier?: string | null;
  companyName?: string | null;
};

export function MerakiCard({ companyIdentifier, companyName }: Props) {
  const shouldLoad = !!companyIdentifier;
  const query = companyIdentifier
    ? `/api/meraki/summary?companyIdentifier=${encodeURIComponent(
        companyIdentifier
      )}`
    : null;
  const { data, error, isLoading } = useSWR<SummaryResponse>(query, fetcher, {
    revalidateOnFocus: false,
  });
  const [open, setOpen] = useState(false);

  const hasData = !!data && data.items.length > 0;
  const totals = data?.totals ?? {
    organizations: 0,
    devices: 0,
    offlineDevices: 0,
    alertingDevices: 0,
    networks: 0,
  };

  if (!shouldLoad) {
    return null;
  }

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
            Meraki
          </CardTitle>
          {companyName ? (
            <span className="text-xs text-muted-foreground truncate max-w-[160px] text-right">
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
              {error?.status === 404 || error?.status === 400
                ? "No Meraki data found. Map this customer to a Meraki organization in Settings → Integrations."
                : error.message || "Unable to load Meraki summary."}
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Map this customer to a Meraki organization in Settings →
              Integrations to see network health snapshots here.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-4">
                <Kpi
                  label="Networks"
                  value={totals.networks}
                  align="center"
                  fontSize={28}
                />
                <Kpi
                  label="Devices"
                  value={totals.devices}
                  align="center"
                  fontSize={28}
                />
                <Kpi
                  label="Offline"
                  value={totals.offlineDevices}
                  align="center"
                  fontSize={28}
                  color="#dc2626"
                />
                <Kpi
                  label="Alerting"
                  value={totals.alertingDevices}
                  align="center"
                  fontSize={28}
                  color="#f97316"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {totals.organizations}
                  {totals.organizations === 1
                    ? " organization mapped"
                    : " organizations mapped"}
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

      <MerakiDialog
        open={open}
        setOpen={setOpen}
        summary={data}
        loading={isLoading}
        error={error as any}
      />
    </>
  );
}

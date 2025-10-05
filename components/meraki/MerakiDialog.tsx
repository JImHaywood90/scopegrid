// Enhanced MerakiDialog with MUI DataGrid + Recharts + full-width layout

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Kpi } from "@/components/ui/kpi";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type {
  SummaryItem,
  SummaryResponse,
} from "@/components/meraki/MerakiCard";
import { useMemo } from "react";
import { MerakiRadarTable } from "./MerakiRadarTable";

const DEVICE_STATUS_COLORS: Record<string, string> = {
  online: "#22c55e",
  offline: "#dc2626",
  alerting: "#f59e0b",
};

function formatExpiration(item: SummaryItem) {
  if (!item.licenseExpiration) return "No license data";
  const date = new Date(item.licenseExpiration);
  if (!Number.isFinite(date.getTime())) return "No license data";
  const formattedDate = date.toLocaleDateString();
  if (typeof item.licenseExpiresInDays !== "number") {
    return `Expires ${formattedDate}`;
  }
  if (item.licenseExpiresInDays < 0) {
    return `Expired ${Math.abs(
      item.licenseExpiresInDays
    )}d ago (${formattedDate})`;
  }
  if (item.licenseExpiresInDays === 0) {
    return `Expires today (${formattedDate})`;
  }
  return `Expires in ${item.licenseExpiresInDays}d (${formattedDate})`;
}

type Props = {
  open: boolean;
  setOpen(next: boolean): void;
  summary?: SummaryResponse | null;
  loading: boolean;
  error?: any;
};

export function MerakiDialog({ open, setOpen, summary, loading }: Props) {
  const items = summary?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        style={{ width: "100vw", height: "80vh", maxWidth: "100vw" }}
        className="p-6 overflow-hidden flex flex-col  bg-white dark:bg-slate-900 overflow-y-auto"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">Meraki Network Overview</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 space-y-6 p-4">
          {items.map((item) => {
            const chartData = [
              { name: "Online", value: item.deviceCounts.online },
              { name: "Offline", value: item.deviceCounts.offline },
              { name: "Alerting", value: item.deviceCounts.alerting },
            ];

            const deviceRows =
              item.devices?.map((dev, index) => ({
                id: dev.serial || index,
                name: dev.name || "—",
                model: dev.model,
                status: dev.status,
                mac: dev.mac,
                serial: dev.serial,
              })) ?? [];

            const deviceColumns: GridColDef[] = [
              { field: "name", headerName: "Name", flex: 1 },
              { field: "model", headerName: "Model", flex: 1 },
              { field: "status", headerName: "Status", flex: 1 },
              { field: "mac", headerName: "MAC", flex: 1 },
              { field: "serial", headerName: "Serial", flex: 1 },
            ];

            return (
              <div
                key={item.merakiOrgId}
                className="rounded-xl border border-slate-200/60 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-lg font-semibold">
                      {item.merakiOrgName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.companyName || item.companyIdentifier}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0">
                    {item.licenseStatus && (
                      <Badge
                        variant="secondary"
                        className="uppercase text-[10px]"
                      >
                        {item.licenseStatus}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatExpiration(item)}
                    </span>
                  </div>
                </div>

                {/* Charts */}
                <div className="mt-4 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {chartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              DEVICE_STATUS_COLORS[entry.name.toLowerCase()]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Device Table */}
                {deviceRows.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-2">Devices</h4>
                    <MerakiRadarTable data={item.devices ?? []} />
                  </div>
                )}
              </div>
            );
          })}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

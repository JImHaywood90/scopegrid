"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { IntegrationDialogShell } from "@/components/integrations/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { AuvikSummary } from "@/components/auvik/types";

const STATUS_COLORS: Record<string, string> = {
  online: "#16a34a",
  offline: "#dc2626",
  warning: "#f97316",
  unknown: "#94a3b8",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  warning: "#facc15",
  info: "#38bdf8",
};

type Props = {
  open: boolean;
  setOpen(next: boolean): void;
  summary: AuvikSummary | null;
  loading: boolean;
  error?: any;
};

function DeviceCharts({ summary }: { summary: AuvikSummary | null }) {
  if (!summary) return null;
  const statusData = Object.entries(summary.devices.statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    key: name,
  }));

  const alertData = Object.entries(summary.alerts.severityCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    key: name,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Device status</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={statusData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {statusData.map((entry) => (
                <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Active alerts</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={alertData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60}>
              {alertData.map((entry) => (
                <Cell key={entry.key} fill={SEVERITY_COLORS[entry.key] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary.alerts.total} open alert{summary.alerts.total === 1 ? '' : 's'} monitored.
        </p>
      </div>
    </div>
  );
}

function DeviceTable({ summary }: { summary: AuvikSummary | null }) {
  if (!summary || summary.devices.items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No devices returned for this site.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/60">
      <h4 className="mb-2 text-sm font-medium text-foreground">Devices</h4>
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
            <th className="py-2 pr-3">Name</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Vendor</th>
            <th className="py-2 pr-3">Model</th>
            <th className="py-2 pr-3">IP</th>
            <th className="py-2 pr-3">Last seen</th>
          </tr>
        </thead>
        <tbody>
          {summary.devices.items.map((device, idx) => (
            <tr key={device.id ?? idx} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-2 pr-3 font-medium text-foreground">
                <div>{device.name}</div>
                {device.siteName ? (
                  <div className="text-xs text-muted-foreground">{device.siteName}</div>
                ) : null}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground capitalize">
                {device.status || 'Unknown'}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{device.vendor ?? '—'}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{device.model ?? '—'}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{device.ip ?? '—'}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {device.lastSeen ? new Date(device.lastSeen).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AlertTable({ summary }: { summary: AuvikSummary | null }) {
  if (!summary || summary.alerts.items.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/60">
      <h4 className="mb-2 text-sm font-medium text-foreground">Open alerts</h4>
      <table className="w-full min-w-[520px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
            <th className="py-2 pr-3">Alert</th>
            <th className="py-2 pr-3">Severity</th>
            <th className="py-2 pr-3">Status</th>
            <th className="py-2 pr-3">Triggered</th>
          </tr>
        </thead>
        <tbody>
          {summary.alerts.items.map((alert, idx) => (
            <tr key={alert.id ?? idx} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-2 pr-3 text-sm text-foreground">
                <div>{alert.title}</div>
                {alert.siteName ? (
                  <div className="text-xs text-muted-foreground">{alert.siteName}</div>
                ) : null}
              </td>
              <td className="py-2 pr-3 text-xs">
                <Badge
                  variant="outline"
                  className={`border-0 ${
                    alert.severity.includes('critical')
                      ? 'bg-rose-500/15 text-rose-600'
                      : alert.severity.includes('warning')
                      ? 'bg-amber-400/20 text-amber-600'
                      : 'bg-sky-400/15 text-sky-600'
                  }`}
                >
                  {alert.severity || 'info'}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {alert.acknowledged ? 'Acknowledged' : 'Active'}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {alert.triggeredAt ? new Date(alert.triggeredAt).toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AuvikDialog({ open, setOpen, summary, loading, error }: Props) {
  const chartsSkeleton = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Skeleton className="h-[180px] w-full rounded-md" />
      <Skeleton className="h-[180px] w-full rounded-md" />
    </div>
  );

  return (
    <IntegrationDialogShell
      open={open}
      onOpenChange={setOpen}
      title="Auvik network overview"
      subtitle={summary?.site?.name ?? summary?.companyName ?? undefined}
      loading={loading}
      error={error ? error.message ?? String(error) : null}
      empty={!loading && !error && !summary}
      emptyMessage="No Auvik data available for this client yet."
      charts={summary ? <DeviceCharts summary={summary} /> : null}
      renderChartsSkeleton={chartsSkeleton}
      renderTable={() => (
        <div className="space-y-4 p-2">
          <DeviceTable summary={summary} />
          <AlertTable summary={summary} />
        </div>
      )}
    />
  );
}

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
import type { SummaryResponse } from "@/components/meraki/MerakiCard";

const STATUS_COLORS: Record<string, string> = {
  Online: "#16a34a",
  Offline: "#dc2626",
  Alerting: "#f97316",
};

function aggregateStatuses(summary?: SummaryResponse | null) {
  if (!summary) {
    return { Online: 0, Offline: 0, Alerting: 0 };
  }
  return {
    Online: summary.items.reduce((acc, item) => acc + item.deviceCounts.online, 0),
    Offline: summary.items.reduce((acc, item) => acc + item.deviceCounts.offline, 0),
    Alerting: summary.items.reduce((acc, item) => acc + item.deviceCounts.alerting, 0),
  };
}

function networksPerOrg(summary?: SummaryResponse | null) {
  if (!summary) return [];
  return summary.items.map((item) => ({
    name: item.merakiOrgName,
    value: item.networkCount,
  }));
}

function MerakiCharts({ summary }: { summary?: SummaryResponse | null }) {
  const statusTotals = aggregateStatuses(summary);
  const statusData = Object.entries(statusTotals).map(([name, value]) => ({
    name,
    value,
  }));

  const networkData = networksPerOrg(summary);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Device status distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={statusData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Networks per organization</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={networkData}
              dataKey="value"
              nameKey="name"
              outerRadius={60}
              label
            >
              {networkData.map((entry, idx) => (
                <Cell key={entry.name} fill={`hsl(${(idx * 47) % 360}, 70%, 60%)`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  online: "text-emerald-600",
  offline: "text-rose-600",
  alerting: "text-amber-500",
};

function MerakiTable({ summary }: { summary?: SummaryResponse | null }) {
  const rows = (summary?.items ?? []).flatMap((item) =>
    (item.devices ?? []).map((device) => ({
      orgName: item.merakiOrgName,
      company: item.companyName || item.companyIdentifier,
      status: (device.status ?? "").toLowerCase(),
      statusRaw: device.status ?? "Unknown",
      name: device.name ?? "Unnamed device",
      model: device.model ?? "—",
      mac: device.mac ?? "—",
      serial: device.serial ?? "—",
      networkName: device.networkName ?? "—",
      lastReportedAt: device.lastReportedAt ?? null,
    }))
  );

  if (!rows.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No Meraki device status data available.
      </div>
    );
  }

  const formatLastSeen = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="p-2">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-700">
            <th className="py-2 pr-3 font-medium">Device</th>
            <th className="py-2 pr-3 font-medium">Organization</th>
            <th className="py-2 pr-3 font-medium">Network</th>
            <th className="py-2 pr-3 font-medium">Status</th>
            <th className="py-2 pr-3 font-medium">Model</th>
            <th className="py-2 pr-3 font-medium">Serial</th>
            <th className="py-2 pr-3 font-medium">MAC</th>
            <th className="py-2 pr-3 font-medium">Last Seen</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.serial}-${idx}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-2 pr-3 font-medium text-foreground">{row.name}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                <div>{row.orgName}</div>
                <div>{row.company}</div>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{row.networkName}</td>
              <td className={`py-2 pr-3 capitalize ${STATUS_BADGE[row.status] ?? ""}`}>
                {row.statusRaw}
              </td>
              <td className="py-2 pr-3">{row.model}</td>
              <td className="py-2 pr-3">{row.serial}</td>
              <td className="py-2 pr-3">{row.mac}</td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {formatLastSeen(row.lastReportedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Props = {
  open: boolean;
  setOpen(next: boolean): void;
  summary?: SummaryResponse | null;
  loading: boolean;
  error?: any;
};

export function MerakiDialog({ open, setOpen, summary, loading, error }: Props) {
  return (
    <IntegrationDialogShell
      open={open}
      onOpenChange={setOpen}
      title="Meraki Network Overview"
      loading={loading}
      error={error ? error.message ?? String(error) : null}
      empty={!loading && !error && (summary?.items.length ?? 0) === 0}
      emptyMessage="No Meraki organizations are linked for this company yet."
      charts={<MerakiCharts summary={summary} />}
      renderTable={() => <MerakiTable summary={summary} />}
    />
  );
}

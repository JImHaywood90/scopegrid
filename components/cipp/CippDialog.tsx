"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegrationDialogShell } from "@/components/integrations/dialog";
import type { CippSummary } from "@/components/cipp/types";

const USER_COLORS = ["#2563eb", "#7c3aed", "#0891b2", "#16a34a"];
const SCORE_COLORS = ["#16a34a", "#e2e8f0"];
const SHARE_COLORS = ["#0ea5e9", "#e2e8f0"];

function buildUserChart(summary?: CippSummary | null) {
  if (!summary?.users) return [];
  const { licensed, guests, unlicensed } = summary.users;
  const data: Array<{ name: string; value: number }> = [];
  if (licensed != null) data.push({ name: 'Licensed', value: licensed });
  if (guests != null) data.push({ name: 'Guests', value: guests });
  if (unlicensed != null) data.push({ name: 'Unlicensed', value: unlicensed });
  return data;
}

function buildSecureScoreChart(summary?: CippSummary | null) {
  const percent = summary?.secureScore.percent;
  if (percent == null) return [];
  return [
    { name: 'Score', value: Math.min(100, Math.max(0, percent)) },
    { name: 'Remaining', value: Math.max(0, 100 - Math.min(100, Math.max(0, percent))) },
  ];
}

function buildSharePointChart(summary?: CippSummary | null) {
  const percent = summary?.sharepoint.percent;
  if (percent == null || percent < 0) return [];
  const clamped = Math.min(100, Math.max(0, percent));
  return [
    { name: 'Used', value: clamped },
    { name: 'Available', value: Math.max(0, 100 - clamped) },
  ];
}

type Props = {
  open: boolean;
  setOpen(next: boolean): void;
  summary: CippSummary | null;
  loading: boolean;
  error?: any;
};

export function CippDialog({ open, setOpen, summary, loading, error }: Props) {
  const userChart = buildUserChart(summary);
  const secureChart = buildSecureScoreChart(summary);
  const shareChart = buildSharePointChart(summary);

  const charts = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">User composition</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={userChart} dataKey="value" nameKey="name" outerRadius={60} label>
              {userChart.map((entry, idx) => (
                <Cell key={entry.name} fill={USER_COLORS[idx % USER_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Secure score</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={secureChart} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} startAngle={90} endAngle={-270}>
              {secureChart.map((entry, idx) => (
                <Cell key={entry.name} fill={SCORE_COLORS[idx % SCORE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary?.secureScore.current ?? '—'} / {summary?.secureScore.max ?? '—'}
        </p>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">SharePoint storage</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={shareChart} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60}>
              {shareChart.map((entry, idx) => (
                <Cell key={entry.name} fill={SHARE_COLORS[idx % SHARE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-muted-foreground">
          {summary?.sharepoint.usedGB != null ? `${summary.sharepoint.usedGB} GB used` : 'Usage unknown'}
          {summary?.sharepoint.totalGB != null ? ` of ${summary.sharepoint.totalGB} GB` : ''}
        </p>
      </div>
    </div>
  );

  const renderTable = () => {
    if (!summary) return null;

    const admins = summary.globalAdmins ?? [];
    const partners = summary.partners ?? [];

    return (
      <div className="space-y-4 p-2">
        <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/60">
          <h4 className="mb-2 text-sm font-medium text-foreground">Global administrators</h4>
          {admins.length === 0 ? (
            <p className="text-xs text-muted-foreground">No global admins returned.</p>
          ) : (
            <table className="w-full min-w-[520px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">User principal name</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, idx) => (
                  <tr
                    key={`${admin.userPrincipalName ?? idx}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2 pr-3 font-medium text-foreground">{admin.displayName ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {admin.userPrincipalName ?? '—'}
                    </td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">
                      {admin.accountEnabled === false ? 'Disabled' : 'Enabled'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-900/60">
          <h4 className="mb-2 text-sm font-medium text-foreground">Cross-tenant partners</h4>
          {partners.length === 0 ? (
            <p className="text-xs text-muted-foreground">No partners configured.</p>
          ) : (
            <table className="w-full min-w-[420px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  <th className="py-2 pr-3">Tenant ID</th>
                  <th className="py-2 pr-3">Display name</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner, idx) => (
                  <tr
                    key={`${partner.tenantId ?? idx}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{partner.tenantId ?? '—'}</td>
                    <td className="py-2 pr-3 text-xs text-muted-foreground">{partner.displayName ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  };

  return (
    <IntegrationDialogShell
      open={open}
      onOpenChange={setOpen}
      title="Microsoft 365 posture"
      loading={loading}
      error={error ? error.message ?? String(error) : null}
      empty={!loading && !error && !summary}
      emptyMessage="No CIPP data available for this tenant yet."
      charts={summary ? charts : null}
      renderTable={renderTable}
      renderChartsSkeleton={
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={`cipp-chart-skel-${idx}`} className="h-[180px] w-full rounded-md" />
          ))}
        </div>
      }
    />
  );
}

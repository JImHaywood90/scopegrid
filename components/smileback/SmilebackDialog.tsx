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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { IntegrationDialogShell } from "@/components/integrations/dialog";
import type { SmilebackSummary } from "@/components/smileback/types";

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#16a34a",
  neutral: "#f59e0b",
  negative: "#dc2626",
  unknown: "#64748b",
};

function sentimentData(summary?: SmilebackSummary | null) {
  if (!summary) return [];
  return Object.entries(summary.counts).map(([name, value]) => ({
    name,
    value,
  }));
}

function marketingPermissionData(summary?: SmilebackSummary | null) {
  if (!summary) return [];
  const totals = summary.recent.reduce(
    (acc, item) => {
      if (item.marketingPermission === true) acc.approved += 1;
      else if (item.marketingPermission === false) acc.denied += 1;
      else acc.unknown += 1;
      return acc;
    },
    { approved: 0, denied: 0, unknown: 0 }
  );
  if (!summary.recent.length) return [];
  return [
    { name: "Approved", value: totals.approved },
    { name: "Denied", value: totals.denied },
    { name: "Unknown", value: totals.unknown },
  ].filter((entry) => entry.value > 0);
}

function SmilebackCharts({ summary }: { summary?: SmilebackSummary | null }) {
  const sentiments = sentimentData(summary);
  const marketing = marketingPermissionData(summary);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Sentiment distribution</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={sentiments}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {sentiments.map((entry) => (
                <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] ?? "#64748b"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Tagged vs. untagged comments</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={marketing}
              dataKey="value"
              nameKey="name"
              outerRadius={60}
              label
            >
              {marketing.map((entry, idx) => (
                <Cell key={entry.name} fill={`hsl(${(idx * 42) % 360}, 70%, 60%)`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function SmilebackTable({ summary }: { summary?: SmilebackSummary | null }) {
  const recent = summary?.recent ?? [];
  return (
    <div className="p-2">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left dark:border-slate-700">
            <th className="py-2 pr-3 font-medium">Rating</th>
            <th className="py-2 pr-3 font-medium">Comment</th>
            <th className="py-2 pr-3 font-medium">Contact</th>
            <th className="py-2 pr-3 font-medium">Ticket</th>
            <th className="py-2 pr-3 font-medium">Tags</th>
            <th className="py-2 pr-3 font-medium">Marketing</th>
            <th className="py-2 pr-3 font-medium">Rated</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((item) => (
            <tr key={item.id ?? `${item.rating}-${item.ratedOn}-${item.ticketNumber}`} className="border-b border-slate-100 last:border-0 dark:border-slate-800">
              <td className="py-2 pr-3">
                <Badge
                  variant={
                    item.sentiment === "negative"
                      ? "destructive"
                      : item.sentiment === "positive"
                      ? "secondary"
                      : "outline"
                  }
                  className="uppercase text-[10px]"
                >
                  {item.rating ?? "Unknown"}
                </Badge>
              </td>
              <td className="py-2 pr-3 align-top text-foreground">
                {item.comment ? (
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                    {item.comment}
                  </p>
                ) : (
                  <span className="text-xs text-muted-foreground">No comment</span>
                )}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                <div>{item.contactName || "—"}</div>
                <div>{item.contactEmail || ""}</div>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                <div>{item.ticketNumber || "—"}</div>
                <div className="line-clamp-2">{item.ticketSubject || ""}</div>
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {item.tags?.length ? item.tags.join(", ") : "—"}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">
                {item.marketingPermission === true
                  ? "Approved"
                  : item.marketingPermission === false
                  ? "Denied"
                  : "Unknown"}
              </td>
              <td className="py-2 pr-3 text-xs text-muted-foreground">{formatDate(item.ratedOn)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Skeleton className="h-[180px] w-full rounded-md" />
      <Skeleton className="h-[180px] w-full rounded-md" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: 8 }).map((_, idx) => (
        <Skeleton key={`smileback-table-skel-${idx}`} className="h-10 w-full" />
      ))}
    </div>
  );
}

type Props = {
  open: boolean;
  setOpen(next: boolean): void;
  summary?: SmilebackSummary | null;
  loading: boolean;
  error?: any;
};

export function SmilebackDialog({ open, setOpen, summary, loading, error }: Props) {
  return (
    <IntegrationDialogShell
      open={open}
      onOpenChange={setOpen}
      title="SmileBack reviews"
      loading={loading}
      error={error ? error.message ?? String(error) : null}
      empty={!loading && !error && (summary?.recent.length ?? 0) === 0}
      emptyMessage="No reviews found for this company yet."
      charts={<SmilebackCharts summary={summary} />}
      renderTable={() => <SmilebackTable summary={summary} />}
      renderChartsSkeleton={<ChartsSkeleton />}
      renderTableSkeleton={<TableSkeleton />}
    />
  );
}

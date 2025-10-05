"use client";

import { useEffect, useMemo, useState } from "react";
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
import { IntegrationDialogShell } from "@/components/integrations/dialog";
import type { SummaryItem, DomainDnsResult } from "@/components/domains/DomainCard";

const TONE_LABEL: Record<SummaryItem["tone"], string> = {
  good: "Healthy",
  warn: "Needs attention",
  bad: "Error",
  pending: "Pending",
};

const TONE_COLORS: Record<SummaryItem["tone"], string> = {
  good: "#16a34a",
  warn: "#f59e0b",
  bad: "#dc2626",
  pending: "#64748b",
};

const RecordColors: Record<string, string> = {
  SPF: "#38bdf8",
  DMARC: "#a855f7",
  DKIM: "#f97316",
};

const STATUS_TEXT_CLASSES: Record<SummaryItem["tone"], string> = {
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-rose-600 dark:text-rose-400",
  pending: "text-muted-foreground",
};

export type DomainDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  summaryItems: SummaryItem[];
  results: Record<string, DomainDnsResult>;
  initialDomain?: string | null;
  loading?: boolean;
  error?: string | null;
};

function computeStatusData(summaryItems: SummaryItem[]) {
  const counts: Record<SummaryItem["tone"], number> = {
    good: 0,
    warn: 0,
    bad: 0,
    pending: 0,
  };
  summaryItems.forEach((item) => {
    counts[item.tone] += 1;
  });
  return (Object.keys(counts) as Array<SummaryItem["tone"]>)
    .filter((tone) => counts[tone] > 0)
    .map((tone) => ({ name: TONE_LABEL[tone], value: counts[tone], tone }));
}

function computeRecordData(summaryItems: SummaryItem[], results: Record<string, DomainDnsResult>) {
  let spf = 0;
  let dmarc = 0;
  let dkim = 0;
  summaryItems.forEach((item) => {
    const result = results[item.domain];
    if (hasRecordLocal(result?.SPF)) spf += 1;
    if (hasRecordLocal(result?.DMARC)) dmarc += 1;
    if (hasRecordLocal(result?.DKIM)) dkim += 1;
  });
  return [
    { name: "SPF", value: spf },
    { name: "DMARC", value: dmarc },
    { name: "DKIM", value: dkim },
  ];
}

function DomainCharts({
  summaryItems,
  results,
}: {
  summaryItems: SummaryItem[];
  results: Record<string, DomainDnsResult>;
}) {
  const statusData = useMemo(() => computeStatusData(summaryItems), [summaryItems]);
  const recordData = useMemo(() => computeRecordData(summaryItems, results), [summaryItems, results]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Domain status</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={statusData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {statusData.map((entry) => (
                <Cell key={entry.name} fill={TONE_COLORS[entry.tone]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-md bg-muted/50 p-3">
        <h3 className="mb-2 text-sm font-medium">Records present</h3>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={recordData} dataKey="value" nameKey="name" outerRadius={60} label>
              {recordData.map((entry) => (
                <Cell key={entry.name} fill={RecordColors[entry.name] ?? "#38bdf8"} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const RecordBadge = ({ value, label }: { value: boolean; label: string }) => (
  <Badge variant={value ? "secondary" : "outline"}>{value ? `${label} ✓` : `${label} ✗`}</Badge>
);

function DomainDetail({ domain, result }: { domain: string; result?: DomainDnsResult }) {
  if (!result) {
    return (
      <div className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/65 p-4 text-sm text-muted-foreground">
        Lookup pending for {domain}.
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        Lookup failed for {domain}: {result.error}
      </div>
    );
  }

  const spfPresent = hasRecordLocal(result.SPF);
  const dmarcPresent = hasRecordLocal(result.DMARC);
  const dkimPresent = hasRecordLocal(result.DKIM);
  const nsPresent = hasRecordLocal(result.NS);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-sm">{result.Domain}</div>
          <div className="text-xs text-muted-foreground">
            Email provider: {result.EmailProvider || "Unknown"}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <RecordBadge value={spfPresent} label="SPF" />
          <RecordBadge value={dmarcPresent} label="DMARC" />
          <RecordBadge value={dkimPresent} label="DKIM" />
          <RecordBadge value={nsPresent} label="NS" />
        </div>
      </div>

      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <span className="font-medium">A Record:</span> {result.ARecord || "—"}
        </div>
        <div>
          <span className="font-medium">NS:</span>{" "}
          {Array.isArray(result.NS) ? result.NS.join(", ") : result.NS || "—"}
        </div>
        <div>
          <span className="font-medium">SPF record:</span> {result.SPF?.[0] ?? "—"}
        </div>
        <div>
          <span className="font-medium">DMARC record:</span> {result.DMARC?.[0] ?? "—"}
        </div>
        <div className="sm:col-span-2">
          <span className="font-medium">DKIM record:</span> {result.DKIM?.[0] ?? "—"}
        </div>
      </div>
    </div>
  );
}

export function DomainDialog({
  open,
  onOpenChange,
  summaryItems,
  results,
  initialDomain,
  loading,
  error,
}: DomainDialogProps) {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const preferred = initialDomain && summaryItems.some((item) => item.domain === initialDomain)
      ? initialDomain
      : summaryItems[0]?.domain ?? null;
    setActiveDomain(preferred);
  }, [open, initialDomain, summaryItems]);

  const tableRows = useMemo(() => {
    return summaryItems.map((item) => ({
      domain: item.domain,
      statusLabel: item.statusLabel,
      tone: item.tone,
      provider: results[item.domain]?.EmailProvider || "Unknown",
      spf: hasRecordLocal(results[item.domain]?.SPF),
      dmarc: hasRecordLocal(results[item.domain]?.DMARC),
      dkim: hasRecordLocal(results[item.domain]?.DKIM),
    }));
  }, [summaryItems, results]);

  const renderTable = () => {
    if (!summaryItems.length) return null;

    return (
      <div className="space-y-4 p-2">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-700">
                <th className="py-2 pr-3 font-medium">Domain</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Provider</th>
                <th className="py-2 pr-3 font-medium">SPF</th>
                <th className="py-2 pr-3 font-medium">DMARC</th>
                <th className="py-2 pr-3 font-medium">DKIM</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr
                  key={row.domain}
                  onClick={() => setActiveDomain(row.domain)}
                  className={`cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-muted/50 dark:border-slate-800 ${
                    activeDomain === row.domain ? "bg-muted/40 dark:bg-slate-800/60" : ""
                  }`}
                >
                  <td className="py-2 pr-3 font-medium text-foreground">{row.domain}</td>
                  <td className={`py-2 pr-3 text-xs ${STATUS_TEXT_CLASSES[row.tone]}`}>
                    {row.statusLabel}
                  </td>
                  <td className="py-2 pr-3 text-xs text-muted-foreground">{row.provider}</td>
                  <td className="py-2 pr-3 text-xs">{row.spf ? "Yes" : "No"}</td>
                  <td className="py-2 pr-3 text-xs">{row.dmarc ? "Yes" : "No"}</td>
                  <td className="py-2 pr-3 text-xs">{row.dkim ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeDomain ? (
          <DomainDetail domain={activeDomain} result={results[activeDomain]} />
        ) : null}
      </div>
    );
  };

  return (
    <IntegrationDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title="Domain health"
      loading={loading}
      error={error ?? null}
      empty={!loading && !error && summaryItems.length === 0}
      emptyMessage="No domains detected yet."
      charts={summaryItems.length ? <DomainCharts summaryItems={summaryItems} results={results} /> : null}
      renderTable={renderTable}
    />
  );
}
const hasRecordLocal = (values?: string[] | string): boolean => {
  if (!values) return false;
  if (Array.isArray(values)) {
    return values.some((v) => v && v !== "No record found");
  }
  return values !== "No record found";
};

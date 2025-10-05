"use client";
import { useEffect, useMemo, useState } from "react";
import {
  normalizeStatusName,
  ALL_STATUSES,
  STATUS_COLORS,
} from "./backupUtils";
import { Kpi } from "../ui/kpi";
import { BackupRadarDialog } from "./BackupRadarDialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function BackupRadarCard({
  companyName,
}: {
  companyName: string;
}) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!companyName) return;
    fetch(
      `/api/backups/backups?SearchByCompanyName=${encodeURIComponent(
        companyName
      )}&nocache=false&Size=1000`
    )
      .then((res) => res.json())
      .then((data) => {
        const grouped = groupByStatus(data.Results ?? []);
        setStats(grouped);
      })
      .catch(() => setStats({})); // defensive
  }, [companyName]);

  const groupByStatus = (items: any[]): Record<string, number> => {
    const grouped: Record<string, number> = {};
    for (const item of items) {
      const status = normalizeStatusName(item?.status?.name) ?? "Unknown";
      grouped[status] = (grouped[status] ?? 0) + 1;
    }
    return grouped;
  };

  const visibleStatuses = useMemo(
    () => ALL_STATUSES.filter((s) => (stats[s] ?? 0) > 0),
    [stats]
  );

  const total = useMemo(
    () => Object.values(stats).reduce((a, b) => a + (b || 0), 0),
    [stats]
  );

  const handleOpenDrawer = () => {
    if (total > 0) {
      setOpen(true);
    }
  };

  return (
    <>
      <Card
        onClick={handleOpenDrawer}
        className="group h-full cursor-pointer rounded-2xl border border-slate-200/70 bg-white/85 transition-all hover:border-slate-300/80 hover:shadow-md hover:ring-1 hover:ring-slate-300/60 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70 dark:hover:border-slate-600/80 dark:hover:ring-slate-500/50"
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <h2 className="text-base font-medium text-foreground">Backup Radar</h2>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">Total jobs: {total}</span>
          )}
        </CardHeader>
        <CardContent>
          {visibleStatuses.length === 0 ? (
            <div className="text-sm text-muted-foreground">No backup results found.</div>
          ) : (
            <div className="flex gap-2 overflow-x-auto">
              {visibleStatuses.map((status) => (
                <Kpi
                  key={status}
                  label={status}
                  value={stats[status]!}
                  color={STATUS_COLORS[status]}
                  align="center"
                  fontSize={32}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <BackupRadarDialog open={open} setOpen={setOpen} companyName={companyName} />
    </>
  );
}

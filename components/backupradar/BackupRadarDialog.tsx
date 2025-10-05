"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { STATUS_COLORS, normalizeStatusName } from "./backupUtils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BackupRadarTable } from "./BackupRadarTable";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";

export type BackupRadarDevice = {
  backupId: number;
  jobName: string;
  deviceName: string;
  companyName: string;
  methodName: string;
  deviceType: string;
  status: {
    name: string;
    id: number;
  };
  lastResult: string;
  ticketCount: number;
  isVerified: boolean;
};

export function BackupRadarDialog({
  open,
  setOpen,
  companyName,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  companyName: string;
}) {
  const [data, setData] = useState<BackupRadarDevice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !companyName) return;
    setLoading(true);
    fetch(
      `/api/backups/backups?SearchByCompanyName=${encodeURIComponent(
        companyName
      )}&Size=1000`
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res?.Results ?? []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [open, companyName]);

  const filtered = useMemo(() => {
    return data.filter((d) => {
      const q = search.toLowerCase();
      return (
        d.deviceName?.toLowerCase().includes(q) ||
        d.methodName?.toLowerCase().includes(q) ||
        d.jobName?.toLowerCase().includes(q)
      );
    });
  }, [data, search]);

  const statusCounts: Record<string, number> = {};
  const methodCounts: Record<string, number> = {};

  data.forEach((item) => {
    const status = normalizeStatusName(item.status?.name) ?? "Unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;

    const method = item.methodName || "Unknown";
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const methodData = Object.entries(methodCounts).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        style={{ width: "100vw", height: "80vh", maxWidth: "100vw" }}
        className="p-6 overflow-hidden flex flex-col"
      >
        <DialogHeader className="flex flex-row items-center justify-between mb-4">
          <DialogTitle className="text-2xl">
            Backup Radar – {companyName}
          </DialogTitle>
        </DialogHeader>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {loading ? (
            <>
              <Skeleton className="h-[180px] w-full rounded-md" />
              <Skeleton className="h-[180px] w-full rounded-md" />
            </>
          ) : (
            <>
              <div className="bg-muted/50 p-3 rounded-md">
                <h3 className="text-sm font-medium mb-2">Backup Jobs by Status</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[
                              entry.name as keyof typeof STATUS_COLORS
                            ] ?? "#999"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-muted/50 p-3 rounded-md">
                <h3 className="text-sm font-medium mb-2">
                  Backup Methods Distribution
                </h3>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={methodData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={50}
                      label
                    >
                      {methodData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`hsl(${(index * 47) % 360}, 70%, 60%)`}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {loading ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={`table-skel-${idx}`} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <BackupRadarTable data={filtered} />
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

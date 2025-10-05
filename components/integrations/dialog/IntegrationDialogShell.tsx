"use client";

import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export type IntegrationDialogShellProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  subtitle?: ReactNode;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: ReactNode;
  charts?: ReactNode;
  renderTable: () => ReactNode;
  renderChartsSkeleton?: ReactNode;
  renderTableSkeleton?: ReactNode;
};

const defaultChartSkeleton = (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Skeleton className="h-[180px] w-full rounded-md" />
    <Skeleton className="h-[180px] w-full rounded-md" />
  </div>
);

const defaultTableSkeleton = (
  <div className="space-y-2 p-2">
    {Array.from({ length: 8 }).map((_, idx) => (
      <Skeleton key={`integration-table-skel-${idx}`} className="h-10 w-full" />
    ))}
  </div>
);

export function IntegrationDialogShell({
  open,
  onOpenChange,
  title,
  subtitle,
  loading,
  error,
  empty,
  emptyMessage,
  charts,
  renderTable,
  renderChartsSkeleton,
  renderTableSkeleton,
}: IntegrationDialogShellProps) {
  const showLoading = !!loading;
  const showError = !!error && !loading;
  const showEmpty = !!empty && !loading && !error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ width: "100vw", height: "80vh", maxWidth: "100vw" }}
        className="p-6 overflow-hidden flex flex-col bg-white dark:bg-slate-900"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
          {subtitle ? (
            <div className="text-sm text-muted-foreground">{subtitle}</div>
          ) : null}
        </DialogHeader>

        <div className="mb-4">
          {showLoading
            ? renderChartsSkeleton ?? defaultChartSkeleton
            : showError
            ? null
            : showEmpty
            ? null
            : charts}
        </div>

        <ScrollArea className="flex-1 overflow-auto">
          {showLoading ? (
            renderTableSkeleton ?? defaultTableSkeleton
          ) : showError ? (
            <div className="p-4 text-sm text-rose-600">{error}</div>
          ) : showEmpty ? (
            <div className="p-4 text-sm text-muted-foreground">
              {emptyMessage ?? "No data available."}
            </div>
          ) : (
            renderTable()
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

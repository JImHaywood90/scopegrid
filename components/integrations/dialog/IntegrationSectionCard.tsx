"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function IntegrationSectionCard({
  title,
  children,
  className,
  headerRight,
}: {
  title?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white/85 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60",
        className,
      )}
    >
      {title || headerRight ? (
        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          {title ? <div className="text-sm font-medium text-foreground">{title}</div> : <div />}
          {headerRight ?? null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

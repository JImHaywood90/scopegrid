"use client";

import { Kpi } from "@/components/ui/kpi";

export type IntegrationMetric = {
  label: string;
  value: string | number;
  color?: string;
  align?: "left" | "center" | "right";
  fontSize?: number;
};

export function IntegrationMetricGrid({
  metrics,
  className,
}: {
  metrics: IntegrationMetric[];
  className?: string;
}) {
  if (!metrics.length) return null;
  return (
    <div
      className={`flex flex-wrap gap-4 ${className ?? ""}`.trim()}
      data-slot="integration-metric-grid"
    >
      {metrics.map((metric) => (
        <Kpi
          key={metric.label}
          label={metric.label}
          value={metric.value}
          color={metric.color}
          align={metric.align ?? "center"}
          fontSize={metric.fontSize ?? 28}
        />
      ))}
    </div>
  );
}

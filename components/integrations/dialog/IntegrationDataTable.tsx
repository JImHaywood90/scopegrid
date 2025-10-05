"use client";

import { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IntegrationSectionCard } from "./IntegrationSectionCard";

export function IntegrationDataTable({
  title,
  children,
  height = 320,
}: {
  title?: ReactNode;
  children: ReactNode;
  height?: number;
}) {
  return (
    <IntegrationSectionCard title={title} className="p-0">
      <ScrollArea style={{ height }} className="px-4 py-3">
        {children}
      </ScrollArea>
    </IntegrationSectionCard>
  );
}

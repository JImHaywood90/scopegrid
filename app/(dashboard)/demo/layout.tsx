"use client";

import DemoHeader from "@/components/DemoHeader";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  // No onboarding checks, no SWR — demo is standalone
  return (
    <section className="flex flex-col min-h-screen">
      <DemoHeader />
      <div className="flex-1">{children}</div>
    </section>
  );
}
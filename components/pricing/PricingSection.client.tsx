"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Plan = {
  priceId: string;
  nickname?: string;
  interval?: "month" | "year";
  unitAmount: number;
  currency: string;
  productName: string;
  productDesc: string;
  features: string[];
  productId: string;
  trialDays?: number;
};

export default function PricingSectionClient() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/stripe/plans", { cache: "no-store" });
        const j = await r.json();
        setPlans(Array.isArray(j) ? j : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // group by product to compute savings vs monthly
  const groupedByProduct = useMemo(() => {
    const map = new Map<string, { month?: Plan; year?: Plan }>();
    for (const p of plans) {
      const g = map.get(p.productId) ?? {};
      if (p.interval === "month") g.month = p;
      if (p.interval === "year") g.year = p;
      map.set(p.productId, g);
    }
    return map;
  }, [plans]);

  const visible = useMemo(
    () =>
      plans
        .filter((p) => p.interval === interval)
        .sort((a, b) => a.unitAmount - b.unitAmount),
    [plans, interval]
  );

  function computeAnnualSavings(
    productId: string
  ): { pct: number; text: string } | null {
    const g = groupedByProduct.get(productId);
    if (!g?.month || !g?.year) return null;
    const monthlyAnnual = g.month.unitAmount * 12;
    const yearlyPrice = g.year.unitAmount;
    if (!monthlyAnnual || !yearlyPrice) return null;
    const pct = Math.round((1 - yearlyPrice / monthlyAnnual) * 100); // e.g., 20
    if (pct <= 0) return null;
    return { pct, text: `Save ${pct}% annually` };
  }

  async function startCheckout(priceId: string) {
    const r = await fetch("/api/stripe/start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ priceId }),
    });
    if (!r.ok) {
      console.error(await r.text());
      alert("Could not start checkout");
      return;
    }
    const { url } = await r.json();
    if (url) window.location.href = url;
  }

  return (
    <section id="pricing" className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* header + interval toggle */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Pricing
            </h2>
            {/* <p className="mt-1 text-slate-600 dark:text-slate-300">
              Pick a plan, complete checkout, and we’ll finish account setup
              automatically.
            </p>{" "} */}
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Preliminary pricing previews. Sorry we're not ready to take your
              money just yet!
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-1 bg-white/70 dark:bg-slate-900/50 backdrop-blur">
            <Button
              variant={interval === "month" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 rounded-lg",
                interval === "month" ? "" : "text-slate-600 dark:text-slate-300"
              )}
              onClick={() => setInterval("month")}
            >
              Monthly
            </Button>
            <Button
              variant={interval === "year" ? "default" : "ghost"}
              className={cn(
                "px-3 py-1 rounded-lg",
                interval === "year" ? "" : "text-slate-600 dark:text-slate-300"
              )}
              onClick={() => setInterval("year")}
            >
              Yearly{" "}
              <span className="ml-1 text-xs opacity-80">(save up to 20%)</span>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading plans…</div>
        ) : visible.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border p-6 border-slate-200/70 dark:border-slate-700/60",
              "bg-white/85 dark:bg-slate-900/65 backdrop-blur"
            )}
          >
            <p className="text-sm text-muted-foreground">
              No plans for this billing interval yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {visible.map((plan) => {
              const savings = computeAnnualSavings(plan.productId);
              const showSavings = interval === "year" && savings;
              const hasTrial =
                Number.isFinite(plan.trialDays) && (plan.trialDays ?? 0) > 0;

              return (
                <Card
                  key={plan.priceId}
                  className={cn(
                    "rounded-2xl border p-4 border-slate-200/70 dark:border-slate-700/60",
                    "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle>{plan.productName}</CardTitle>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {(plan.unitAmount / 100).toLocaleString(undefined, {
                            style: "currency",
                            currency: plan.currency.toUpperCase(),
                          })}
                          <span className="text-xs text-muted-foreground">
                            {" "}
                            / {interval}
                          </span>
                        </div>
                        {showSavings ? (
                          <div
                            className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]
                            border-emerald-200 bg-emerald-50 text-emerald-700
                            dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300"
                          >
                            {savings!.text}
                          </div>
                        ) : null}
                        {hasTrial ? (
                          <div
                            className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]
                            border-amber-200 bg-amber-50 text-amber-700
                            dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300"
                          >
                            {plan.trialDays}-day free trial
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {plan.productDesc ? (
                      <p className="text-sm text-muted-foreground">
                        {plan.productDesc}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Everything you need to get started.
                      </p>
                    )}

                    {plan.features?.length ? (
                      <ul className="text-sm list-disc pl-4 space-y-1">
                        {plan.features.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    ) : null}

                    <Button
                      disabled
                      className="w-full"
                      onClick={() => startCheckout(plan.priceId)}
                    >
                      {hasTrial
                        ? `Start ${plan.trialDays}-day free trial`
                        : `Choose ${plan.productName}`}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

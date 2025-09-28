'use client';

import { useEffect, useState } from 'react';
import { listPlans, startCheckout } from './actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Plan = Awaited<ReturnType<typeof listPlans>>[number];

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [interval, setInterval] = useState<'month' | 'year'>('month');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await listPlans();
      setPlans(p);
      setLoading(false);
    })();
  }, []);

  const visible = plans
    .filter(p => p.interval === interval)
    .sort((a, b) => a.unitAmount - b.unitAmount);

  return (
    <section className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-semibold mb-4">Choose your plan</h1>
      <p className="text-muted-foreground mb-6">Pick a plan, pay, then create your ScopeGrid account.</p>

      <div className="mb-6 flex items-center gap-2">
        <Button variant={interval === 'month' ? 'default' : 'outline'} onClick={() => setInterval('month')}>Monthly</Button>
        <Button variant={interval === 'year' ? 'default' : 'outline'} onClick={() => setInterval('year')}>Yearly</Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm">Email for billing & account</span>
          <Input placeholder="you@company.com" className="w-[260px]" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading plans…</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {visible.map(plan => (
            <Card key={plan.priceId} className={cn(
              'rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
              'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
            )}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{plan.productName}</span>
                  <span className="text-lg font-semibold">
                    {(plan.unitAmount / 100).toLocaleString(undefined, { style: 'currency', currency: plan.currency.toUpperCase() })}
                    <span className="text-xs text-muted-foreground"> / {interval}</span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{plan.productDesc}</p>
                {plan.features?.length ? (
                  <ul className="text-sm list-disc pl-4 space-y-1">
                    {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                ) : null}

                <form
                  action={async () => {
                    await startCheckout({ priceId: plan.priceId, email });
                  }}
                >
                  <Button className="w-full" disabled={!email}>
                    {interval === 'year' ? 'Start annual' : 'Start monthly'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

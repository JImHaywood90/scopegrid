'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import ConnectWiseForm from '@/components/ConnectWise/ConnectWiseForm';
import { cn } from '@/lib/utils';
import PSAPicker from '@/components/onboarding/PsaPicker';
import HaloPSAForm from '@/components/halo/HaloPSAForm';

const fetcher = (u: string) => fetch(u, { cache: 'no-store' }).then(r => r.json());

export default function OnboardingPage() {
  const router = useRouter();
  const { data: settings, mutate } = useSWR<{ onboardingCompleted?: boolean }>('/api/tenant-settings', fetcher);

  const [psa, setPsa] = useState<'connectwise' | 'halo'>('connectwise');
  const [savingDone, setSavingDone] = useState(false);

  // Ensure base rows exist
  useEffect(() => { fetch('/api/bootstrap', { method: 'POST' }).catch(() => {}); }, []);

  // If already onboarded, send to dashboard
  useEffect(() => {
    if (settings?.onboardingCompleted) router.replace('/dashboard');
  }, [settings, router]);

  async function markCompleteAndGo() {
    await fetch('/api/onboarding/complete', { method: 'POST' });
    await mutate();
    router.replace('/dashboard');
  }

  return (
    <section className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
      <div className={cn(
        'rounded-2xl border-slate-200/70 dark:border-slate-700/60 p-5',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}>
        <h1 className="text-lg lg:text-2xl font-medium">Welcome! Let’s connect your PSA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick your PSA and add credentials. You can change or add more later in Settings → Integrations.
        </p>
      </div>

      <PSAPicker value={psa} onChange={setPsa} />

      {/* PSA-specific step */}
      {psa === 'connectwise' && (
        <ConnectWiseForm
          compact
          onSaved={() => setSavingDone(true)}
          onTestSuccess={async () => {
            setSavingDone(true);
            await markCompleteAndGo();
          }}
        />
      )}
      {psa === 'halo' && (
        <HaloPSAForm
          compact
          onSaved={() => setSavingDone(true)}
          onTestSuccess={async () => {
            setSavingDone(true);
            await markCompleteAndGo();
          }}
        />
      )}

      {/* Action row */}
      <Card
        className={cn(
          'p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60',
          'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
        )}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Continue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={markCompleteAndGo}
            disabled={!savingDone}
            title={!savingDone ? 'Save credentials or test connection first' : ''}
          >
            Go to dashboard
          </Button>
          <Button variant="outline" onClick={() => router.replace('/settings/integrations')}>
            Configure later
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

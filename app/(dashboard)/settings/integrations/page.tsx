// app/(dashboard)/settings/integrations/page.tsx
'use client';

import { Suspense } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Image from 'next/image';
import { INTEGRATIONS } from '@/components/integrations/registry';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full ring-2',
        ok ? 'bg-emerald-500 ring-emerald-500/20' : 'bg-rose-500 ring-rose-500/20'
      )}
      aria-label={ok ? 'Connected' : 'Not connected'}
      title={ok ? 'Connected' : 'Not connected'}
    />
  );
}

// Skeleton used while the Suspense boundary resolves
function GridSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card
          key={i}
          className="p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-md bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
          </div>
          <div className="mt-3 h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="mt-2 h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        </Card>
      ))}
    </div>
  );
}

function Grid() {
  const { data } = useSWR<{ items: { slug: string; connected: boolean }[] }>(
    '/api/integrations',
    fetcher
  );
  const status = new Map<string, boolean>((data?.items ?? []).map((r) => [r.slug, !!r.connected]));

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {INTEGRATIONS.map((i) => {
        const ok = status.get(i.slug) ?? false;
        return (
          <Link key={i.slug} href={`/settings/integrations/${i.slug}`} className="block group">
            <Card
              className={cn(
                'p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60',
                'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image
                    src={i.logoLight}
                    alt={i.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                  />
                  <div className="font-medium">{i.name}</div>
                </div>
                <StatusDot ok={ok} />
              </div>
              {i.description ? (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{i.description}</p>
              ) : null}
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

export default function IntegrationsIndex() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Integrations</h1>
      <Suspense fallback={<GridSkeleton />}>
        <Grid />
      </Suspense>
    </section>
  );
}

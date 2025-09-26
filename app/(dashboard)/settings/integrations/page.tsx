// app/(dashboard)/settings/integrations/page.tsx
'use client';

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

export default function IntegrationsIndex() {
  const { data } = useSWR<{ items: { slug: string; connected: boolean }[] }>('/api/integrations', fetcher);
  const status = new Map<string, boolean>((data?.items ?? []).map((r) => [r.slug, !!r.connected]));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Integrations</h1>

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
    </section>
  );
}

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import UnmatchedAdditionRow from './UnmatchedAdditionRow';
import UnmatchedConfigRow from './UnmatchedConfigRow';
import { cn } from '@/lib/utils';
import type { ScanResp } from './types';

export default function UnmatchedPanel({
  data,
  mutate,
}: {
  data: ScanResp;
  mutate(): void;
}) {
  const [filter, setFilter] = React.useState<'both'|'additions'|'configurations'>('both');
  const [q, setQ] = React.useState('');

  const L = (s?: string|null) => (s || '').toLowerCase();
  const matches = (hay: string[]) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return hay.some((h) => h.includes(needle));
  };

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="shrink-0">
        <CardTitle>Unmatched items ({data.counts.unmatched})</CardTitle>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="inline-flex rounded-lg border p-1">
            {(['both','additions','configurations'] as const).map((v) => (
              <Button
                key={v}
                size="sm"
                variant={filter === v ? 'default' : 'ghost'}
                onClick={() => setFilter(v)}
                className={cn(
                  'h-8',
                  filter === v
                    ? 'bg-orange-500 hover:bg-orange-600 text-white'
                    : 'text-foreground'
                )}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Input
              className="w-[220px]"
              placeholder="Search unmatched…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <Button variant="outline" onClick={() => mutate()}>Rescan</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 overflow-y-auto pr-1">
        {(filter === 'both' || filter === 'additions') && (
          <>
            <div className="text-xs text-muted-foreground">Agreement additions</div>
            {data.unmatched.additions
              .filter((a) =>
                matches([
                  L(a.productIdentifier),
                  L(a.description),
                  L(a.invoiceDescription),
                  L(a.vendorSku),
                  L(a.manufacturerPartNumber),
                  L(a.agreementName),
                  String(a.agreementId ?? ''),
                ])
              )
              .map((a) => (
                <UnmatchedAdditionRow
                  key={`add-${a.id}`}
                  item={a}
                  products={data.products}
                  companyIdentifier={data.companyIdentifier}
                  onChange={mutate}
                />
              ))}
            {data.unmatched.additions.length === 0 && (
              <div className="text-sm text-muted-foreground">All additions are matched.</div>
            )}
          </>
        )}

        {(filter === 'both' || filter === 'configurations') && (
          <>
            <div className="mt-2 text-xs text-muted-foreground">Configurations</div>
            {data.unmatched.configurations
              .filter((c) => matches([L(c.name), L(c.typeName)]))
              .map((c) => (
                <UnmatchedConfigRow key={`cfg-${c.id}`} item={c} />
              ))}
            {data.unmatched.configurations.length === 0 && (
              <div className="text-sm text-muted-foreground">All configurations are matched.</div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

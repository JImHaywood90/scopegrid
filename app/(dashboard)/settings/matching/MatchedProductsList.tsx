'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import ThemedImage from '@/components/media/ThemedImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMatching } from '@/hooks/useMatching';
import type { ScanResp, CatalogProduct, CatalogSignal } from './types';

type MatchEntry = {
  signal: CatalogSignal;
  reason?: string;
};

export default function MatchedProductsList({
  data,
  onChange,
}: {
  data: ScanResp;
  onChange(): void;
}) {
  const { matched } = useMatching<CatalogSignal, CatalogProduct>({ slugToId: data.overrideCatalogIds });

  const grouped = React.useMemo(() => {
    const map = new Map<string, { product: CatalogProduct; matches: MatchEntry[] }>();
    for (const match of matched) {
      const catalog = match.catalog as CatalogProduct;
      const key = String(catalog.slug ?? catalog.id ?? catalog.name);
      if (!map.has(key)) {
        map.set(key, { product: catalog, matches: [] });
      }
      map.get(key)!.matches.push({ signal: match.product as CatalogSignal, reason: match.reason });
    }
    return Array.from(map.values()).sort((a, b) => a.product.name.localeCompare(b.product.name));
  }, [matched]);

  if (grouped.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        No matched products yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map(({ product, matches }) => (
        <MatchCard
          key={product.slug || product.id}
          product={product}
          matches={matches}
          companyIdentifier={data.companyIdentifier}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function MatchCard({
  product,
  matches,
  companyIdentifier,
  onChange,
}: {
  product: CatalogProduct;
  matches: MatchEntry[];
  companyIdentifier: string;
  onChange(): void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Card
      className={cn(
        'border-slate-200/70 dark:border-slate-700/60',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur p-4'
      )}
    >
      <header className="flex items-center gap-3">
        <ThemedImage
          light={product.logoLightPath}
          dark={product.logoDarkPath || product.logoLightPath}
          alt={product.name}
          width={36}
          height={36}
        />
        <div className="min-w-0">
          <div className="font-medium truncate">{product.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {product.vendor || product.category || product.slug}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="secondary">
            {matches.length} match{matches.length === 1 ? '' : 'es'}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? 'Hide' : 'View'} details
          </Button>
        </div>
      </header>

      {open && (
        <div className="mt-3 space-y-3">
          {matches.map(({ signal, reason }) => (
            <MatchRow
              key={`${signal.kind || 'signal'}-${signal.id}`}
              signal={signal}
              reason={reason}
              companyIdentifier={companyIdentifier}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function MatchRow({
  signal,
  reason,
  companyIdentifier,
  onChange,
}: {
  signal: CatalogSignal;
  reason?: string;
  companyIdentifier: string;
  onChange(): void;
}) {
  const kind = signal.kind ?? 'item';
  const meta = signal.meta ?? {};
  const primaryLabel =
    (typeof meta.productIdentifier === 'string' && meta.productIdentifier) ||
    (typeof meta.description === 'string' && meta.description) ||
    (typeof meta.invoiceDescription === 'string' && meta.invoiceDescription) ||
    signal.name;

  const supporting: string[] = [];
  if (meta.vendorSku) supporting.push(`SKU ${meta.vendorSku}`);
  if (meta.manufacturerPartNumber) supporting.push(`MPN ${meta.manufacturerPartNumber}`);
  if (meta.typeName) supporting.push(`Type ${meta.typeName}`);
  if (meta.modelNumber) supporting.push(`Model ${meta.modelNumber}`);
  if (meta.agreementName || meta.agreementId) supporting.push(`Agreement ${meta.agreementName ?? meta.agreementId}`);

  const reasonLabel =
    reason === 'override'
      ? 'Override'
      : reason === 'name'
      ? 'Name match'
      : reason === 'term'
      ? 'Term match'
      : 'Match';

  const reasonDetail = deriveReasonDetail(signal, reason);
  const canExclude = kind === 'addition' || kind === 'configuration';

  return (
    <div className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/70 dark:bg-slate-900/65 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{primaryLabel}</div>
          {supporting.length > 0 && (
            <div className="text-xs text-muted-foreground mt-1 truncate">
              {supporting.join(' · ')}
            </div>
          )}
          <div className="mt-1 flex flex-wrap gap-2 items-center text-xs">
            <Badge variant="outline">{kind}</Badge>
            <Badge variant="secondary">{reasonLabel}</Badge>
            {reasonDetail && (
              <span className="text-muted-foreground">
                matched on <code className="px-1 py-[1px] bg-black/5 dark:bg-white/10 rounded">{reasonDetail}</code>
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => excludeSignal(kind, signal.id, companyIdentifier, onChange)}
            disabled={!canExclude}
          >
            Exclude
          </Button>
        </div>
      </div>
    </div>
  );
}

function deriveReasonDetail(signal: CatalogSignal, reason?: string) {
  if (!reason || !signal.terms || signal.terms.length === 0) return '';
  const firstTerm = signal.terms[0];
  if (reason === 'name' || reason === 'term') return firstTerm;
  return '';
}

async function excludeSignal(kind: string | undefined, id: string | number, companyIdentifier: string, refresh: () => void) {
  if (!kind) return;
  const res = await fetch('/api/matching/exclusions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      companyIdentifier,
      entityType: kind,
      entityId: Number(id),
    }),
  });
  if (!res.ok) {
    console.error('Failed to exclude', await res.text());
    return;
  }
  refresh();
}

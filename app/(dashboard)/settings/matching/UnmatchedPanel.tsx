'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandGroup, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import type { ScanResp, CatalogProduct, CatalogSignal } from './types';
import { useMatching } from '@/hooks/useMatching';

const KIND_LABEL: Record<string, string> = {
  addition: 'Agreement addition',
  configuration: 'Configuration',
};

export default function UnmatchedPanel({
  data,
  mutate,
}: {
  data: ScanResp;
  mutate(): void;
}) {
  const { unmatched } = useMatching<CatalogSignal, CatalogProduct>({ slugToId: data.overrideCatalogIds });
  const [filter, setFilter] = React.useState('');

  const items = React.useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return unmatched.filter((signal) => {
      if (!needle) return true;
      const haystack = [signal.name, ...(signal.terms ?? []), ...(Object.values(signal.meta ?? {}) as string[])];
      return haystack.some((text) =>
        typeof text === 'string' && text.toLowerCase().includes(needle)
      );
    });
  }, [unmatched, filter]);

  return (
    <Card className="flex flex-col min-h-0">
      <CardHeader className="shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Unmatched signals ({items.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            Rescan
          </Button>
        </div>
        <Input
          placeholder="Search unmatched…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </CardHeader>
      <CardContent className="min-h-0 overflow-y-auto space-y-3 pr-1">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Everything is matched 🎉</div>
        ) : (
          items.map((signal) => (
            <UnmatchedRow
              key={`${signal.kind ?? 's'}-${signal.id}`}
              signal={signal}
              mutate={mutate}
              companyIdentifier={data.companyIdentifier}
              catalog={data.catalog}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function UnmatchedRow({
  signal,
  mutate,
  companyIdentifier,
  catalog,
}: {
  signal: CatalogSignal;
  mutate(): void;
  companyIdentifier: string;
  catalog: CatalogProduct[];
}) {
  const kind = signal.kind ?? 'signal';
  const meta = signal.meta ?? {};
  const terms = signal.terms ?? [];
  const [open, setOpen] = React.useState(false);
  const [selectedSlug, setSelectedSlug] = React.useState<string | null>(null);
  const [limitToCompany, setLimitToCompany] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const termCandidates = React.useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(signal.terms)) {
      signal.terms.forEach((t) => {
        if (typeof t === 'string' && t.trim()) set.add(t.trim());
      });
    }
    const metaStrings = [
      meta.productIdentifier,
      meta.description,
      meta.invoiceDescription,
      meta.vendorSku,
      meta.manufacturerPartNumber,
      meta.modelNumber,
    ];
    metaStrings.forEach((v) => {
      if (typeof v === 'string' && v.trim()) set.add(v.trim());
    });
    if (typeof signal.name === 'string' && signal.name.trim()) set.add(signal.name.trim());
    return Array.from(set).slice(0, 8);
  }, [signal, meta]);

  async function exclude() {
    if (!kind) return;
    const res = await fetch('/api/matching/exclusions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entityType: kind, entityId: Number(signal.id), companyIdentifier }),
    });
    if (!res.ok) {
      console.error('Failed to exclude', await res.text());
      return;
    }
    mutate();
  }

  async function match(selected: string | null, scope: 'tenant' | 'company') {
    if (!selected) return;
    const product = catalog.find((c) => c.slug === selected);
    if (!product) return;
    const payloadTerms = termCandidates
      .map((t) => t.toLowerCase())
      .filter(Boolean);
    if (payloadTerms.length === 0 && typeof signal.name === 'string') {
      const name = signal.name.trim().toLowerCase();
      if (name) payloadTerms.push(name);
    }
    if (payloadTerms.length === 0) return;

    setSaving(true);
    try {
      const res = await fetch('/api/matching/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productSlug: product.slug,
          catalogId: product.id,
          terms: payloadTerms,
          scope,
          companyIdentifier: scope === 'company' ? companyIdentifier : null,
          mode: 'append',
        }),
      });
      if (!res.ok) {
        console.error('Failed to create override', await res.text());
        return;
      }
      setOpen(false);
      mutate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/65 backdrop-blur p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{signal.name}</div>
          <div className="mt-1 flex flex-wrap gap-2 items-center text-xs">
            <Badge variant="outline">{KIND_LABEL[kind] ?? kind}</Badge>
            {meta.agreementName && <Badge variant="secondary">Agreement {meta.agreementName}</Badge>}
          </div>
          {terms.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground truncate">
              {terms.join(', ')}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="xs" onClick={exclude}>
            Exclude
          </Button>
          <MatchPopover
            open={open}
            onOpenChange={setOpen}
            catalog={catalog}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
            limitToCompany={limitToCompany}
            onToggleScope={() => setLimitToCompany((v) => !v)}
            onConfirm={() => match(selectedSlug, limitToCompany ? 'company' : 'tenant')}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}

function MatchPopover({
  open,
  onOpenChange,
  catalog,
  selectedSlug,
  onSelect,
  limitToCompany,
  onToggleScope,
  onConfirm,
  saving,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  catalog: CatalogProduct[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  limitToCompany: boolean;
  onToggleScope: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return catalog;
    return catalog.filter((p) => {
      const hay = [p.name, p.slug, p.vendor ?? '', p.category ?? '', ...(p.description ?? [])];
      return hay.some((h) => h && h.toLowerCase().includes(needle));
    });
  }, [catalog, search]);

  const selectedLabel = selectedSlug
    ? catalog.find((p) => p.slug === selectedSlug)?.name ?? selectedSlug
    : null;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="default">
          Match
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] space-y-3">
        <div className="space-y-1">
          <div className="text-sm font-medium">Link to product</div>
          <div className="text-xs text-muted-foreground">Applies an override so future scans match automatically.</div>
        </div>
        {selectedLabel && (
          <div className="text-xs">
            Selected: <span className="font-medium">{selectedLabel}</span>
          </div>
        )}
        <Command>
          <CommandInput placeholder="Search catalog…" value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No products found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={p.slug}
                  onSelect={(slug) => {
                    onSelect(slug);
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.vendor || p.category || p.slug}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Scope</span>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={limitToCompany} onChange={onToggleScope} />
            Limit to this company
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={!selectedSlug || saving}>
            {saving ? 'Linking…' : 'Link product'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

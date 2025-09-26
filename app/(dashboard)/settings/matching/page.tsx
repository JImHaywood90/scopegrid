'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover';
import {
  Command, CommandList, CommandEmpty, CommandInput, CommandGroup, CommandItem,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CompanyPicker from '@/components/ConnectWise/company-picker';

type ScanResp = {
  companyIdentifier: string;
  products: { slug: string; name: string; vendor?: string; category?: string; logoLightPath: string; logoDarkPath?: string }[];
  counts: { agreements: number; additions: number; configurations: number; matched: number; unmatched: number; };
  matched: { additions: any[]; configurations: any[]; };
  unmatched: {
    additions: { id: number; agreementId?: number; productIdentifier?: string|null; description?: string|null; invoiceDescription?: string|null }[];
    configurations: { id: number; name: string; typeName?: string }[];
  };
};

const fetcher = async (u: string) => {
  const r = await fetch(u, { cache: 'no-store' });
  const t = await r.text();
  let j: any = null; try { j = JSON.parse(t); } catch {}
  if (!r.ok) { const e: any = new Error(j?.error || t); e.status = r.status; throw e; }
  return j as ScanResp;
};

function ProductSelect({
  products,
  value,
  onChange,
  placeholder = 'Pick a product…',
}: {
  products: ScanResp['products'];
  value?: string;
  onChange: (slug: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const label = value ? (products.find(p => p.slug === value)?.name ?? value) : '';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="justify-between w-[260px]">
          <span className="truncate">{label || placeholder}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search products…" />
          <CommandList>
            <CommandEmpty>No products.</CommandEmpty>
            <CommandGroup>
              {products.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={p.slug}
                  onSelect={(v) => { onChange(v); setOpen(false); }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.vendor || p.category || p.slug}
                    </div>
                  </div>
                  <Check className={cn('h-4 w-4', value === p.slug ? 'opacity-100' : 'opacity-0')} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UnmatchedRowAddition({
  item, products, companyIdentifier, onDone,
}: {
  item: ScanResp['unmatched']['additions'][number];
  products: ScanResp['products'];
  companyIdentifier: string;
  onDone: () => void;
}) {
  const [slug, setSlug] = React.useState<string | undefined>();
  // sensible default term (prefer identifier)
  const defaultTerm =
    item.productIdentifier?.trim()
    || item.description?.slice(0, 64)?.trim()
    || item.invoiceDescription?.slice(0, 64)?.trim()
    || '';

  const [terms, setTerms] = React.useState(defaultTerm);
  const [limitToCompany, setLimitToCompany] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!slug || !terms.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/matching/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productSlug: slug,
          terms: terms.split(','),
          companyIdentifier: limitToCompany ? companyIdentifier : null,
          mode: 'append',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (e) {
      console.error(e);
      alert('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium">
        {item.productIdentifier || item.description || item.invoiceDescription || `Addition #${item.id}`}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <ProductSelect products={products} value={slug} onChange={setSlug as any} />
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor={`terms-add-${item.id}`} className="text-xs">Terms (comma separated)</Label>
          <Input
            id={`terms-add-${item.id}`}
            placeholder="e.g. sentinelone, s1"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={limitToCompany} onChange={(e) => setLimitToCompany(e.target.checked)} />
          Limit to this company
        </label>
        <Button onClick={save} disabled={saving || !slug || !terms.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Map'}
        </Button>
      </div>
    </div>
  );
}

function UnmatchedRowConfig({
  item, products, companyIdentifier, onDone,
}: {
  item: ScanResp['unmatched']['configurations'][number];
  products: ScanResp['products'];
  companyIdentifier: string;
  onDone: () => void;
}) {
  const [slug, setSlug] = React.useState<string | undefined>();
  const defaultTerm = (item.name || item.typeName || '').slice(0, 64);
  const [terms, setTerms] = React.useState(defaultTerm);
  const [limitToCompany, setLimitToCompany] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!slug || !terms.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/matching/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productSlug: slug,
          terms: terms.split(','),
          companyIdentifier: limitToCompany ? companyIdentifier : null,
          mode: 'append',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDone();
    } catch (e) {
      console.error(e);
      alert('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="text-sm font-medium">
        {item.name || item.typeName || `Configuration #${item.id}`}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 items-center">
        <ProductSelect products={products} value={slug} onChange={setSlug as any} />
        <div className="flex-1 min-w-[220px]">
          <Label htmlFor={`terms-cfg-${item.id}`} className="text-xs">Terms (comma separated)</Label>
          <Input
            id={`terms-cfg-${item.id}`}
            placeholder="e.g. meraki, mx"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={limitToCompany} onChange={(e) => setLimitToCompany(e.target.checked)} />
          Limit to this company
        </label>
        <Button onClick={save} disabled={saving || !slug || !terms.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Map'}
        </Button>
      </div>
    </div>
  );
}

export default function MatchingPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const qsCompany = sp.get('companyIdentifier') || sp.get('CompanyIdentifier') || '';

  const { data, error, isLoading, mutate } = useSWR<ScanResp>(
    '/api/matching/scan' + (qsCompany ? `?companyIdentifier=${encodeURIComponent(qsCompany)}` : ''),
    fetcher
  );

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg lg:text-2xl font-medium">Product Matching</h1>
        <div className="flex items-center gap-2">
          <CompanyPicker onChanged={() => mutate()} className="w-[340px]" />
          <Button variant="outline" onClick={() => mutate()}>Rescan</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
        </div>
      ) : error ? (
        error.status === 400 ? (
          <div className="text-sm text-muted-foreground">Pick a company to scan.</div>
        ) : (
          <div className="text-red-600">Failed to scan.</div>
        )
      ) : !data ? null : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Unmatched items ({data.counts.unmatched})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs text-muted-foreground">Agreement additions</div>
              {data.unmatched.additions.length === 0 ? (
                <div className="text-sm text-muted-foreground">All additions are matched.</div>
              ) : (
                data.unmatched.additions.map((a) => (
                  <UnmatchedRowAddition
                    key={`add-${a.id}`}
                    item={a}
                    products={data.products}
                    companyIdentifier={data.companyIdentifier}
                    onDone={() => mutate()}
                  />
                ))
              )}

              <div className="mt-4 text-xs text-muted-foreground">Configurations</div>
              {data.unmatched.configurations.length === 0 ? (
                <div className="text-sm text-muted-foreground">All configurations are matched.</div>
              ) : (
                data.unmatched.configurations.map((c) => (
                  <UnmatchedRowConfig
                    key={`cfg-${c.id}`}
                    item={c}
                    products={data.products}
                    companyIdentifier={data.companyIdentifier}
                    onDone={() => mutate()}
                  />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Currently matched ({data.counts.matched})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground">Agreement additions</div>
              {data.matched.additions.length === 0 ? (
                <div className="text-sm text-muted-foreground">No matched additions.</div>
              ) : (
                <ul className="space-y-2">
                  {data.matched.additions.map((m) => (
                    <li key={`m-add-${m.id}`} className="text-sm">
                      <span className="font-medium">{m.hit}</span>
                      <span className="text-muted-foreground"> — {m.source}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 text-xs text-muted-foreground">Configurations</div>
              {data.matched.configurations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No matched configurations.</div>
              ) : (
                <ul className="space-y-2">
                  {data.matched.configurations.map((m) => (
                    <li key={`m-cfg-${m.id}`} className="text-sm">
                      <span className="font-medium">{m.hit}</span>
                      <span className="text-muted-foreground"> — {m.name || m.typeName}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

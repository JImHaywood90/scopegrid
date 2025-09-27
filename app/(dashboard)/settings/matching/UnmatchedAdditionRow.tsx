'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import ProductSelect from './ProductSelect';
import { cn } from '@/lib/utils';
import type { ProductLite } from './types';

export default function UnmatchedAdditionRow({
  item,
  products,
  companyIdentifier,
  onChange,
}: {
  item: {
    id: number;
    agreementId?: number;
    agreementName?: string;
    productIdentifier?: string | null;
    description?: string | null;
    invoiceDescription?: string | null;
    vendorSku?: string | null;
    manufacturerPartNumber?: string | null;
  };
  products: ProductLite[];
  companyIdentifier: string;
  onChange(): void;
}) {
  const [slug, setSlug] = React.useState<string>();
  const [terms, setTerms] = React.useState(
    item.productIdentifier?.trim()
      || item.description?.slice(0, 64)?.trim()
      || item.invoiceDescription?.slice(0, 64)?.trim()
      || ''
  );
  const [limit, setLimit] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  async function mapNow() {
    if (!slug || !terms.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/matching/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          productSlug: slug,
          terms: terms.split(','),
          companyIdentifier: limit ? companyIdentifier : null,
          mode: 'append',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      onChange();
    } catch (e) {
      console.error(e);
      alert('Failed to save mapping');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}
    >
      <div className="font-medium text-sm">
        {item.productIdentifier || item.description || item.invoiceDescription || `Addition #${item.id}`}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {item.vendorSku && <>SKU: {item.vendorSku} · </>}
        {item.manufacturerPartNumber && <>MPN: {item.manufacturerPartNumber} · </>}
        {item.agreementId && <>Agreement: {item.agreementName || item.agreementId}</>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ProductSelect products={products} value={slug} onChange={setSlug as any} />
        <div className="flex-1 min-w-[220px]">
          <Label className="text-xs">Terms (comma separated)</Label>
          <Input value={terms} onChange={(e) => setTerms(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={limit} onChange={(e) => setLimit(e.target.checked)} />
          Limit to this company
        </label>
        <Button onClick={mapNow} disabled={saving || !slug || !terms.trim()}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Map'}
        </Button>
      </div>
    </div>
  );
}

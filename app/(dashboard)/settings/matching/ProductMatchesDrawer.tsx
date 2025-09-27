'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import ThemedImage from '@/components/media/ThemedImage';
import ProductSelect from './ProductSelect';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatchedAddition, MatchedConfig, ProductLite } from './types';

export default function ProductMatchesDrawer({
  product,
  additions,
  configurations,
  companyIdentifier,
  allProducts,
  onChange,
}: {
  product: ProductLite;
  additions: MatchedAddition[];
  configurations: MatchedConfig[];
  companyIdentifier: string;
  allProducts: ProductLite[];
  onChange(): void;
}) {
  async function unmatch(entityType: 'addition'|'configuration', entityId: number) {
    const res = await fetch('/api/matching/exclusions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ companyIdentifier, entityType, entityId }),
    });
    if (!res.ok) return alert('Failed to unmatch');
    onChange();
  }

  async function remap(entityType: 'addition'|'configuration', entityId: number, sourceTerms: string, nextSlug: string) {
    const res = await fetch('/api/matching/override', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        productSlug: nextSlug,
        terms: sourceTerms.split(',').map((s) => s.trim()).filter(Boolean),
        companyIdentifier,
        mode: 'append',
      }),
    });
    if (!res.ok) return alert('Failed to remap');
    await fetch('/api/matching/exclusions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ companyIdentifier, entityType, entityId }),
    });
    onChange();
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">View Matches</Button>
      </DrawerTrigger>
      <DrawerContent
        className={cn(
          'max-h-[80vh] overflow-y-auto rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
          'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
        )}
      >
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-3">
            <ThemedImage
              light={product.logoLightPath}
              dark={product.logoDarkPath || product.logoLightPath}
              alt={product.name}
              width={28}
              height={28}
            />
            {product.name}
          </DrawerTitle>
          <DrawerDescription>Review and correct matches for this product.</DrawerDescription>
        </DrawerHeader>

        <div className="p-4 space-y-5">
          {/* Additions */}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Agreement additions</div>
            {additions.length === 0 ? (
              <div className="text-sm text-muted-foreground">No additions matched.</div>
            ) : additions.map((it) => {
              const title = it.productIdentifier || it.description || it.invoiceDescription || `Addition #${it.id}`;
              const why = it.source ? `Matched on: "${it.source}"` : '';
              return (
                <div key={`add-${it.id}`} className={cn('rounded-lg border p-3 border-slate-200/70 dark:border-slate-700/60', 'bg-white/85 dark:bg-slate-900/65 backdrop-blur')}>
                  <div className="text-sm font-medium">{title}</div>
                  <div className="text-xs text-muted-foreground mt-1 space-x-1">
                    {it.vendorSku && <span>SKU: {it.vendorSku}</span>}
                    {it.manufacturerPartNumber && <span>· MPN: {it.manufacturerPartNumber}</span>}
                    {it.agreementId && <span>· Agreement: {it.agreementName || it.agreementId}</span>}
                  </div>
                  {why && (
                    <div className="mt-1 text-xs">
                      <span className="text-muted-foreground">Reason: </span>
                      <code className="rounded bg-black/5 px-1 py-[1px] dark:bg-white/10">{why}</code>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => unmatch('addition', it.id)}>
                      <X className="h-4 w-4 mr-1" /> Unmatch
                    </Button>
                    <ProductSelect
                      products={allProducts}
                      onChange={(slug) =>
                        remap('addition', it.id, (it.productIdentifier || it.description || it.invoiceDescription || ''), slug)
                      }
                      placeholder="Remap to…"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configurations */}
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Configurations</div>
            {configurations.length === 0 ? (
              <div className="text-sm text-muted-foreground">No configurations matched.</div>
            ) : configurations.map((it) => {
              const title = it.name || it.typeName || `Configuration #${it.id}`;
              const why = it.source ? `Matched on: "${it.source}"` : '';
              return (
                <div key={`cfg-${it.id}`} className={cn('rounded-lg border p-3 border-slate-200/70 dark:border-slate-700/60', 'bg-white/85 dark:bg-slate-900/65 backdrop-blur')}>
                  <div className="text-sm font-medium">{title}</div>
                  {it.typeName && <div className="text-xs text-muted-foreground mt-1">Type: {it.typeName}</div>}
                  {why && (
                    <div className="mt-1 text-xs">
                      <span className="text-muted-foreground">Reason: </span>
                      <code className="rounded bg-black/5 px-1 py-[1px] dark:bg-white/10">{why}</code>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => unmatch('configuration', it.id)}>
                      <X className="h-4 w-4 mr-1" /> Unmatch
                    </Button>
                    <ProductSelect
                      products={allProducts}
                      onChange={(slug) =>
                        remap('configuration', it.id, (it.name || it.typeName || ''), slug)
                      }
                      placeholder="Remap to…"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 flex justify-end">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

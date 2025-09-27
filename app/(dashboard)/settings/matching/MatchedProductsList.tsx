'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ThemedImage from '@/components/media/ThemedImage';
import { cn } from '@/lib/utils';
import ProductMatchesDrawer from './ProductMatchesDrawer';
import type { ScanResp } from './types';

export default function MatchedProductsList({
  data,
  onChange,
}: {
  data: ScanResp;
  onChange(): void;
}) {
  const entries = Object.values(data.matchedByProduct).filter(
    (g) => g.additions.length + g.configurations.length > 0
  );

  const [page, setPage] = React.useState(1);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const slice = entries.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className={cn(
        'flex flex-col h-full rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}
    >
      <div className="grid gap-4 grid-cols-1 overflow-y-auto pr-1">
        {slice.map(({ product, additions, configurations }) => (
          <Card
            key={product.slug}
            className={cn(
              'rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
              'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
            )}
          >
            <div className="flex items-center gap-3">
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
              <div className="ml-auto text-xs text-muted-foreground">
                {additions.length} additions · {configurations.length} configs
              </div>
            </div>

            <CardContent className="px-0 pt-3">
              <ProductMatchesDrawer
                product={product}
                additions={additions}
                configurations={configurations}
                companyIdentifier={data.companyIdentifier}
                allProducts={data.products}
                onChange={onChange}
              />
            </CardContent>
          </Card>
        ))}

        {entries.length === 0 && (
          <div className="text-sm text-muted-foreground">No matched products yet.</div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            className="text-xs underline disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <div className="text-xs text-muted-foreground">
            Page {page} / {totalPages}
          </div>
          <button
            className="text-xs underline disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

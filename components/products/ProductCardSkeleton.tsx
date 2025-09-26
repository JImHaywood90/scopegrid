'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <Card
      aria-hidden
      className={cn(
        // same container feel as ProductCard
        'group h-full rounded-2xl flex flex-col min-h-[140px]',
        'bg-white/85 dark:bg-slate-900/70',
        'border border-slate-200/70 dark:border-slate-700/60',
        'backdrop-blur-sm',
        className
      )}
    >
      {/* Header: logo stub (left) + link icon stub (right) */}
      <div className="h-10 px-3 pt-2 pb-1 flex items-start justify-between gap-2">
        <div className="h-6 w-28 rounded-md bg-muted/70 animate-pulse" />
        <div className="size-7 rounded-full bg-muted/60 animate-pulse" />
      </div>

      {/* Body: two short lines, matches compact card height */}
      <div className="px-3 pb-3 pt-1">
        <div className="h-3 w-[85%] rounded bg-muted/80 animate-pulse" />
        <div className="mt-2 h-3 w-[60%] rounded bg-muted/60 animate-pulse" />
      </div>
    </Card>
  );
}

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export default function UnmatchedConfigRow({
  item,
}: {
  item: { id: number; name: string; typeName?: string };
}) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 border-slate-200/70 dark:border-slate-700/60',
        'bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all'
      )}
    >
      <div className="text-sm font-medium">{item.name || item.typeName || `Configuration #${item.id}`}</div>
      <div className="mt-2 text-xs text-muted-foreground">Type: {item.typeName || '—'}</div>
    </div>
  );
}

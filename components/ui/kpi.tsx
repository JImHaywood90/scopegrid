'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export function Kpi({
  label,
  value,
  align = 'left',
  fontSize = 48,
  color,
  className,
}: {
  label: string;
  value: string | number;
  align?: 'left' | 'center' | 'right';
  fontSize?: number;
  color?: string;
  className?: string;
}) {
  const alignmentClasses =
    align === 'center'
      ? 'items-center text-center'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  return (
    <div className={cn('flex flex-col gap-1', alignmentClasses, className)}>
      {label && (
        <span className="text-xs text-muted-foreground leading-tight">{label}</span>
      )}
      <span
        className="font-extrabold leading-tight"
        style={{ fontSize, color }}
      >
        {value}
      </span>
    </div>
  );
}

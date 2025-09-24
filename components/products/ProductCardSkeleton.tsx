'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-3">
        <div className="aspect-[2/1] w-full rounded-md bg-muted animate-pulse" />
      </CardContent>
      <div className="px-3 pb-3">
        <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
        <div className="mt-2 h-2 w-1/3 rounded bg-muted/70 animate-pulse" />
      </div>
    </Card>
  );
}

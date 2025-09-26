// components/products/ProductCard.tsx
'use client';

import { Card } from '@/components/ui/card';
import ThemedImage from '../media/ThemedImage';
import { ExternalLink } from 'lucide-react';

export type ProductCardProps = {
  id: number | string;
  name: string;
  description?: string | null;
  links?: Record<string, string> | null;
  logoLightPath: string;
  logoDarkPath?: string;
  href?: string;
  className?: string;
  onClick?: () => void;
};

export default function ProductCard({
  name,
  description,
  links,
  logoLightPath,
  logoDarkPath,
  href,
  className,
  onClick,
}: ProductCardProps) {
  // choose the first link as the primary action
  const entries = Object.entries(links ?? {}).filter(([, url]) => !!url);
  const primary = entries[0] as [string, string] | undefined;

  const content = (
    <Card
      title={name}
      onClick={onClick}
      className={[
        'group h-full cursor-pointer rounded-2xl transition-all',
        'flex flex-col min-h-[140px]', // compact, consistent
        'bg-white/85 dark:bg-slate-900/70',
        'border border-slate-200/70 dark:border-slate-700/60',
        'hover:shadow-md hover:border-slate-300/80 dark:hover:border-slate-600/80',
        'hover:ring-1 hover:ring-slate-300/60 dark:hover:ring-slate-500/50',
        'backdrop-blur-sm',
        className ?? '',
      ].join(' ')}
    >
      {/* Header: logo on left, link icon on right */}
      <div className="h-10 px-3 pt-2 pb-1 flex items-start justify-between gap-2">
        <ThemedImage
          light={logoLightPath}
          dark={logoDarkPath}
          alt={name}
          width={220}
          height={40}
          className="max-h-8 w-auto object-contain"
        />
        {primary && (
          <a
            href={primary[1]}
            title={primary[0] || 'Open site'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={[
              'inline-flex items-center justify-center',
              'size-7 rounded-full',
              'border border-slate-300/60 dark:border-slate-600/60',
              'bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/70 dark:hover:bg-slate-700/70',
              'transition-colors',
            ].join(' ')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="sr-only">Open {primary[0] || 'site'}</span>
          </a>
        )}
      </div>

      {/* Body: compact 2-line clamp */}
      <div className="px-3 pb-3 pt-1 text-[13px] leading-5 text-muted-foreground">
        <p
          className="min-h-[2.4rem]"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description || '—'}
        </p>
      </div>
    </Card>
  );

  return href ? (
    <a href={href} aria-label={name} className="block h-full">
      {content}
    </a>
  ) : (
    content
  );
}

// components/products/ProductCard.tsx
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export type ProductCardProps = {
  id: number | string;
  name: string;
  vendor?: string | null;
  category?: string | null;
  logoLightPath: string;
  href?: string;
  className?: string;
  onClick?: () => void;
  /** Optional: 'compact' (default) or 'normal' */
  size?: 'compact' | 'normal';
};

export default function ProductCard({
  name,
  vendor,
  category,
  logoLightPath,
  href,
  className,
  onClick,
  size = 'compact',
}: ProductCardProps) {
  const compact = size === 'compact';

  const content = (
    <Card
      className={`group hover:shadow-sm transition-shadow cursor-pointer rounded-2xl ${className ?? ''}`}
      onClick={onClick}
    >
      <CardContent
        className={`${compact ? 'aspect-[2/1] p-2' : 'aspect-[5/4] p-3'} flex items-center justify-center`}
      >
        <Image
          src={logoLightPath}
          alt={name}
          width={220}
          height={120}
          className={`${compact ? 'max-h-10' : 'max-h-16'} w-auto object-contain`}
        />
      </CardContent>

      <div className={`${compact ? 'px-3 pb-2' : 'px-3 pb-3'}`}>
        <div className="text-sm font-medium leading-tight truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {vendor || category || '\u00A0'}
        </div>
      </div>
    </Card>
  );

  return href ? (
    <a href={href} aria-label={name} className="block">
      {content}
    </a>
  ) : (
    content
  );
}

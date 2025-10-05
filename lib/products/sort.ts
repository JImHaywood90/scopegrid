export type SortDirection = 'asc' | 'desc';

export type Product = Record<string, any> & {
  id?: string | number;
  name?: string;
};

export type SortKey = keyof Product | string;

export interface SortOptions {
  key: SortKey;
  direction?: SortDirection;
}

export function sortProducts<T extends Product>(items: T[], opts: SortOptions): T[] {
  const { key, direction = 'asc' } = opts;
  const dir = direction === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = (a as any)?.[key];
    const bv = (b as any)?.[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
    return String(av).localeCompare(String(bv)) * dir;
  });
}

export type Predicate<T> = (item: T) => boolean;

export function filterProducts<T>(items: T[], predicate: Predicate<T>): T[] {
  return predicate ? items.filter(predicate) : items;
}

export function groupProducts<T extends Product, K extends string | number | symbol>(
  items: T[],
  groupBy: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = groupBy(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}


"use client";
import { useMemo } from 'react';
import { useProductSort } from '@/contexts/ProductSortContext';
import { sortProducts, filterProducts } from '@/lib/products/sort';

export function useProducts<T extends Record<string, any>>(products: T[], predicate?: (p: T) => boolean) {
  const { key, direction } = useProductSort();

  return useMemo(() => {
    const filtered = predicate ? filterProducts(products, predicate) : products;
    return sortProducts(filtered as any[], { key, direction }) as T[];
  }, [products, predicate, key, direction]);
}


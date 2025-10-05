"use client";
import { useMemo } from 'react';
import { useMatchingContext } from '@/contexts/MatchingContext';
import { computeMatches } from '@/lib/matching/logic';
import { useMemo as _useMemo } from 'react';

export function useMatching<TProduct extends { id?: string | number; name?: string }, TCatalog extends { id?: string | number; name?: string; slug?: string }>(opts?: { slugToId?: Record<string, string | number> }) {
  const { products, catalog, overrides, exclusions } = useMatchingContext<TProduct, TCatalog>();

  const result = useMemo(() => computeMatches<TProduct, TCatalog>({
    products,
    catalog,
    overrides,
    exclusions,
    slugToId: opts?.slugToId,
  }), [products, catalog, overrides, exclusions, opts?.slugToId]);

  return result;
}

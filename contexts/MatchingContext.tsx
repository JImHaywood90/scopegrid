"use client";
import React from 'react';

export interface MatchingState<TProduct, TCatalog> {
  products: TProduct[];
  catalog: TCatalog[];
  overrides: Record<string, string>;
  exclusions: Set<string>;
  setOverrides: (o: Record<string, string>) => void;
  setExclusions: (e: Set<string>) => void;
}

const MatchingContext = React.createContext<MatchingState<any, any> | undefined>(undefined);

export function MatchingProvider<TProduct, TCatalog>({
  children,
  products,
  catalog,
  initialOverrides = {},
  initialExclusions = new Set<string>(),
}: {
  children: React.ReactNode;
  products: TProduct[];
  catalog: TCatalog[];
  initialOverrides?: Record<string, string>;
  initialExclusions?: Set<string>;
}) {
  const [overrides, setOverrides] = React.useState<Record<string, string>>(initialOverrides);
  const [exclusions, setExclusions] = React.useState<Set<string>>(initialExclusions);

  const value = React.useMemo(
    () => ({ products, catalog, overrides, exclusions, setOverrides, setExclusions }),
    [products, catalog, overrides, exclusions]
  );

  return <MatchingContext.Provider value={value as any}>{children}</MatchingContext.Provider>;
}

export function useMatchingContext<TProduct, TCatalog>() {
  const ctx = React.useContext(MatchingContext) as MatchingState<TProduct, TCatalog> | undefined;
  if (!ctx) throw new Error('useMatchingContext must be used within MatchingProvider');
  return ctx;
}


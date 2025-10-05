"use client";
import React from 'react';

export type SortDirection = 'asc' | 'desc';

export interface ProductSortState {
  key: string;
  direction: SortDirection;
  setKey: (k: string) => void;
  setDirection: (d: SortDirection) => void;
}

const ProductSortContext = React.createContext<ProductSortState | undefined>(undefined);

export function ProductSortProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = React.useState<string>('name');
  const [direction, setDirection] = React.useState<SortDirection>('asc');

  const value = React.useMemo(() => ({ key, direction, setKey, setDirection }), [key, direction]);
  return <ProductSortContext.Provider value={value}>{children}</ProductSortContext.Provider>;
}

export function useProductSort() {
  const ctx = React.useContext(ProductSortContext);
  if (!ctx) throw new Error('useProductSort must be used within ProductSortProvider');
  return ctx;
}


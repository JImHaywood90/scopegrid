import type { PsaAdapter, PsaKind } from './types';

const adapters = new Map<PsaKind, PsaAdapter>();

export function registerAdapter(adapter: PsaAdapter) {
  adapters.set(adapter.kind, adapter);
}

export function getAdapter(kind: PsaKind): PsaAdapter | undefined {
  return adapters.get(kind);
}


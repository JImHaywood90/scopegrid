export type PsaKind = 'connectwise' | 'halo' | 'autotask';

export interface PsaSignal {
  id: string | number;
  name: string;
  terms?: string[]; // extra identifiers: codes, mpn, sku
  kind?: string; // e.g. 'addition', 'configuration'
  meta?: Record<string, unknown>;
}

export interface PsaAdapterContext {
  origin: string;
  cookie: string;
  companyIdentifier: string;
}

export interface PsaAdapterResult {
  entities: any[];
  meta?: Record<string, unknown>;
}

export interface PsaAdapter {
  kind: PsaKind;
  fetchCompanyEntities(ctx: PsaAdapterContext): Promise<PsaAdapterResult>;
  extractSignals(result: PsaAdapterResult): PsaSignal[];
}

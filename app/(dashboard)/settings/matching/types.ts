import type { PsaSignal } from '@/lib/psa/types';

export type CatalogProduct = {
  id: number;
  slug: string;
  name: string;
  vendor?: string | null;
  category?: string | null;
  description?: string | null;
  logoLightPath: string;
  logoDarkPath?: string | null;
  links?: Record<string, string> | null;
  matchTerms?: string[] | null;
};

export type ProductLite = CatalogProduct;

export type CatalogSignal = PsaSignal & {
  kind?: string;
  meta?: PsaSignal['meta'] & {
    productIdentifier?: string | null;
    description?: string | null;
    invoiceDescription?: string | null;
    vendorSku?: string | null;
    manufacturerPartNumber?: string | null;
    agreementId?: number | null;
    agreementName?: string | null;
    typeName?: string | null;
    vendorName?: string | null;
    manufacturerName?: string | null;
    modelNumber?: string | null;
  };
};

export type ScanResp = {
  companyIdentifier: string;
  feTenantId?: string | null;
  psa: 'connectwise' | 'halo';
  catalog: CatalogProduct[];
  overrideTerms: Record<string, string[]>;
  overrideCatalogIds: Record<string, number>;
  signals: CatalogSignal[];
  exclusions: Array<{ id: number; entityType: string; entityId: number }>;
  counts: {
    agreements: number;
    additions: number;
    configurations: number;
    signals: number;
    catalog: number;
  };
};

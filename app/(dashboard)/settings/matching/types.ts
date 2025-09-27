export type ProductLite = {
  slug: string;
  name: string;
  vendor?: string;
  category?: string;
  logoLightPath: string;
  logoDarkPath?: string;
};

export type MatchedAddition = {
  id: number;
  productIdentifier?: string | null;
  description?: string | null;
  invoiceDescription?: string | null;
  vendorSku?: string | null;
  manufacturerPartNumber?: string | null;
  agreementId?: number;
  agreementName?: string;
  source?: string;
};

export type MatchedConfig = {
  id: number;
  name?: string;
  typeName?: string;
  source?: string;
};

export type ScanResp = {
  companyIdentifier: string;
  products: ProductLite[];
  counts: {
    agreements: number;
    additions: number;
    configurations: number;
    matched: number;
    unmatched: number;
  };
  matched: {
    additions: MatchedAddition[];
    configurations: MatchedConfig[];
  };
  matchedByProduct: Record<string, {
    product: ProductLite;
    additions: MatchedAddition[];
    configurations: MatchedConfig[];
  }>;
  unmatched: {
    additions: {
      id: number;
      agreementId?: number;
      agreementName?: string;
      productIdentifier?: string | null;
      description?: string | null;
      invoiceDescription?: string | null;
      vendorSku?: string | null;
      manufacturerPartNumber?: string | null;
    }[];
    configurations: { id: number; name: string; typeName?: string }[];
  };
};

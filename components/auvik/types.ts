export type AuvikSummary = {
  companyIdentifier: string;
  companyName: string | null;
  site: { id: string | null; name: string | null } | null;
  devices: {
    total: number;
    statusCounts: {
      online: number;
      offline: number;
      warning: number;
      unknown: number;
    };
    items: Array<{
      id: string | null;
      name: string;
      vendor: string | null;
      model: string | null;
      type: string | null;
      ip: string | null;
      status: string;
      lastSeen: string | null;
      siteId: string | null;
      siteName: string | null;
    }>;
  };
  alerts: {
    total: number;
    severityCounts: {
      critical: number;
      warning: number;
      info: number;
    };
    items: Array<{
      id: string | null;
      title: string;
      severity: string;
      acknowledged: boolean;
      triggeredAt: string | null;
      siteId: string | null;
      siteName: string | null;
    }>;
  };
  sites: Array<{ id: string | null; name: string | null }>;
};

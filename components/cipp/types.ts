export type CippSummary = {
  tenantId: string;
  users: {
    total: number | null;
    licensed: number | null;
    guests: number | null;
    unlicensed: number | null;
  };
  secureScore: {
    current: number | null;
    max: number | null;
    percent: number | null;
  };
  sharepoint: {
    percent: number | null;
    usedGB: number | null;
    totalGB: number | null;
  };
  globalAdmins: Array<{
    displayName: string | null;
    userPrincipalName: string | null;
    accountEnabled: boolean | null;
  }>;
  partners: Array<{
    tenantId: string | null;
    displayName: string | null;
  }>;
};

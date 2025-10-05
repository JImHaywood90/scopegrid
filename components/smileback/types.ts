export type SmilebackSummary = {
  companyName: string;
  totalResponses: number;
  score: number | null;
  counts: {
    positive: number;
    neutral: number;
    negative: number;
    unknown: number;
  };
  recent: Array<{
    id: number | string | null;
    rating: string | null;
    comment: string | null;
    status: string | null;
    tags: string[];
    ratedOn: string | null;
    ticketNumber: string | number | null;
    ticketSubject: string | null;
    contactName: string | null;
    contactEmail: string | null;
    sentiment: string | null;
    marketingPermission: boolean | null;
  }>;
};

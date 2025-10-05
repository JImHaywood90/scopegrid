import { NextRequest, NextResponse } from 'next/server';
import {
  getSmilebackAccessTokenForCurrentUser,
  invalidateSmilebackTokenForTenant,
} from '@/lib/integrations/getSmilebackAuth';

export const runtime = 'nodejs';

const MAX_PAGES = 3;
const PAGE_SIZE = 200;

type Review = {
  has_marketing_permission: any;
  id?: number | string;
  rating?: string;
  comment?: string | null;
  status?: string | null;
  tags?: string[];
  rated_on?: string | null;
  last_modified?: string | null;
  viewed_on?: string | null;
  ticket?: {
    id?: number | string;
    reference?: string | number;
    number?: string | number;
    subject?: string | null;
  };
  contact?: {
    name?: string | null;
    email?: string | null;
  };
  company?: {
    id?: string | number;
    name?: string | null;
  };
};

type Paginated<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
} | T[];

const normalizeName = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeSentiment = (rating?: string | null) => {
  const value = (rating ?? '').toLowerCase();
  if (!value) return 'unknown';
  if (['positive', 'happy', 'good', 'great', 'promoter', 'excellent', 'awesome'].some((word) => value.includes(word))) {
    return 'positive';
  }
  if (['negative', 'bad', 'poor', 'detractor', 'terrible', 'awful'].some((word) => value.includes(word))) {
    return 'negative';
  }
  if (['neutral', 'ok', 'meh', 'passive', 'average'].some((word) => value.includes(word))) {
    return 'neutral';
  }
  return value;
};

async function fetchReviews(apiBaseUrl: string, token: string) {
  const base = apiBaseUrl.replace(/\/+$/, '');
  const reviews: Review[] = [];
  let nextUrl: string | null = `${base}/reviews/?limit=${PAGE_SIZE}&ordering=-rated_on`;
  let page = 0;

  while (nextUrl && page < MAX_PAGES) {
    page += 1;
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw Object.assign(new Error(txt || 'Failed to fetch SmileBack reviews'), { status: res.status });
    }
    const json = (await res.json().catch(() => null)) as Paginated<Review> | null;
    if (!json) break;
    console.log("smileback json", json);
    if (Array.isArray(json)) {
      reviews.push(...json);
      break;
    }

    reviews.push(...(json.results ?? []));
    nextUrl = json.next || null;
  }

  return reviews;
}

export async function GET(req: NextRequest) {
  const companyName = req.nextUrl.searchParams.get('companyName')?.trim();
  if (!companyName) {
    return NextResponse.json({ error: 'Missing companyName' }, { status: 400 });
  }

  try {
    const { accessToken, apiBaseUrl, feTenantId } = await getSmilebackAccessTokenForCurrentUser();

    let reviews: Review[] = [];
    try {
      reviews = await fetchReviews(apiBaseUrl, accessToken);
    } catch (err: any) {
      if (err?.status === 401) {
        invalidateSmilebackTokenForTenant(feTenantId);
        const retry = await getSmilebackAccessTokenForCurrentUser();
        reviews = await fetchReviews(retry.apiBaseUrl, retry.accessToken);
      } else {
        throw err;
      }
    }

    const normalizedTarget = normalizeName(companyName);
    const exactMatches = reviews.filter((review) => normalizeName(review.company?.name) === normalizedTarget);

    let matches: Review[] = exactMatches;

    if (matches.length === 0) {
      const fuzzyMatches = reviews.filter((review) => {
        const name = normalizeName(review.company?.name);
        if (!name || !normalizedTarget) return false;
        return name.includes(normalizedTarget) || normalizedTarget.includes(name);
      });
      matches = fuzzyMatches;
    }

    if (matches.length === 0 && normalizedTarget) {
      const tokens = normalizedTarget.split(' ').filter(Boolean);
      if (tokens.length) {
        const tokenMatches = reviews.filter((review) => {
          const name = normalizeName(review.company?.name);
          if (!name) return false;
          return tokens.every((token) => name.includes(token));
        });
        matches = tokenMatches;
      }
    }

    if (matches.length === 0) {
      matches = reviews;
    }

    const mutableCounts: Record<'positive' | 'neutral' | 'negative' | 'unknown', number> = {
      positive: 0,
      neutral: 0,
      negative: 0,
      unknown: 0,
    };

    for (const review of matches) {
      const kind = normalizeSentiment(review.rating);
      if (kind === 'positive' || kind === 'neutral' || kind === 'negative') {
        mutableCounts[kind] += 1;
      } else {
        mutableCounts.unknown += 1;
      }
    }

    const total = matches.length;
    const score = total > 0 ? Math.round((mutableCounts.positive / total) * 100) : null;

    const sorted = [...matches].sort((a, b) => {
      const aDate = Date.parse(a.rated_on || a.last_modified || '') || 0;
      const bDate = Date.parse(b.rated_on || b.last_modified || '') || 0;
      return bDate - aDate;
    });

    const recent = sorted.slice(0, 20).map((item) => {
      const sentiment = normalizeSentiment(item.rating);
      return {
        id: item.id ?? null,
        rating: item.rating ?? null,
        comment: item.comment ?? null,
        status: item.status ?? null,
        tags: Array.isArray(item.tags) ? item.tags : [],
        ratedOn: item.rated_on ?? item.last_modified ?? null,
        ticketNumber: item.ticket?.number ?? item.ticket?.reference ?? item.ticket?.id ?? null,
        ticketSubject: item.ticket?.subject ?? null,
        contactName: item.contact?.name ?? null,
        contactEmail: item.contact?.email ?? null,
        sentiment,
        marketingPermission: typeof item.has_marketing_permission === "boolean" ? item.has_marketing_permission : null,
      };
    });

    return NextResponse.json({
      companyName,
      totalResponses: total,
      score,
      counts: mutableCounts,
      recent,
    });
  } catch (err: any) {
    const status = err?.status ?? (/unauth|token/i.test(String(err?.message)) ? 401 : 500);
    return NextResponse.json({ error: err?.message ?? 'SmileBack summary failed' }, { status });
  }
}

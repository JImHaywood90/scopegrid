import { type NextRequest, NextResponse } from 'next/server';
import { requireFronteggSession } from '@/lib/auth/frontegg';
import {
  getCippAccessTokenForCurrentUser,
  invalidateCippTokenForTenant,
} from '@/lib/integrations/getCippCreds';

export const runtime = 'nodejs';

type CacheEntry = {
  status: number;
  body: string;
  contentType: string;
  normalized: string;
  feTenantId: string;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map<string, CacheEntry>();

const normalizePath = (p: string) => p.replace(/^api\/+/, '');

function stableQueryString(sp: URLSearchParams | Readonly<URLSearchParams>) {
  const pairs = Array.from(sp.entries())
    .filter(([key]) => key.toLowerCase() !== 'nocache')
    .sort(([a], [b]) => a.localeCompare(b));
  return pairs
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function buildCacheKey(feTenantId: string, method: string, normalized: string, sp: URLSearchParams | Readonly<URLSearchParams>) {
  const qs = stableQueryString(sp);
  return `${feTenantId}:${method.toUpperCase()}:${normalized}${qs ? `?${qs}` : ''}`;
}

function getCache(key: string) {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt > Date.now()) return entry;
  memoryCache.delete(key);
  return null;
}

function setCache(key: string, entry: Omit<CacheEntry, 'expiresAt'>, ttlMs = DEFAULT_TTL_MS) {
  memoryCache.set(key, { ...entry, expiresAt: Date.now() + ttlMs });
}

function invalidateByPath(feTenantId: string, normalized: string) {
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.feTenantId === feTenantId && entry.normalized === normalized) {
      memoryCache.delete(key);
    }
  }
}

async function forward(req: NextRequest, params: { path?: string[] }, retry = true): Promise<NextResponse> {
  await requireFronteggSession();

  const { feTenantId, accessToken, apiBaseUrl } = await getCippAccessTokenForCurrentUser();

  const normalized = normalizePath((params.path ?? []).join('/'));
  const sp = req.nextUrl.searchParams;
  const qsRaw = sp.toString();
  const targetUrl = `${apiBaseUrl.replace(/\/+$/, '')}/api/${normalized}${qsRaw ? `?${qsRaw}` : ''}`;

  const method = req.method.toUpperCase();
  const isGet = method === 'GET';
  const bypass = !!sp.get('nocache');

  if (isGet && !bypass) {
    const key = buildCacheKey(feTenantId, method, normalized, sp);
    const hit = getCache(key);
    if (hit) {
      return new NextResponse(hit.body, {
        status: hit.status,
        headers: {
          'content-type': hit.contentType,
          'x-cipp-cache': 'HIT',
        },
      });
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };
  const contentType = req.headers.get('content-type');
  if (contentType) headers['Content-Type'] = contentType;

  const init: RequestInit = { method, headers };
  if (!['GET', 'HEAD'].includes(method)) {
    const body = await req.text();
    if (body) init.body = body;
  }

  const res = await fetch(targetUrl, init);

  if (res.status === 401 && retry) {
    invalidateCippTokenForTenant(feTenantId);
    return forward(req, params, false);
  }

  const responseType = res.headers.get('content-type') || 'application/json';
  const text = await res.text();

  if (isGet && !bypass && res.ok) {
    const key = buildCacheKey(feTenantId, method, normalized, sp);
    setCache(key, {
      status: res.status,
      body: text,
      contentType: responseType,
      normalized,
      feTenantId,
    });
  }

  if (!isGet && res.ok) {
    invalidateByPath(feTenantId, normalized);
  }

  return new NextResponse(text, {
    status: res.status,
    headers: {
      'content-type': responseType,
      'x-cipp-cache': isGet ? (bypass ? 'BYPASS' : 'MISS') : 'WRITE',
    },
  });
}

function buildHandler(method: string) {
  return async (req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) => {
    const params = await ctx.params;
    return forward(req, params);
  };
}

export const GET = buildHandler('GET');
export const POST = buildHandler('POST');
export const PATCH = buildHandler('PATCH');
export const PUT = buildHandler('PUT');
export const DELETE = buildHandler('DELETE');

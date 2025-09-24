import { NextResponse, type NextRequest } from 'next/server';
import { cwHeadersAndBaseForCurrentUser } from '@/lib/connectwise';
import { requireSession } from '@/lib/auth/requireSession';

export const runtime = 'nodejs';

/* ---------------- in-memory cache ---------------- */
const DEFAULT_TTL_MS = Number.isFinite(Number(process.env.CW_CACHE_TTL_MS))
  ? Number(process.env.CW_CACHE_TTL_MS)
  : 30 * 60 * 1000; // 30 minutes

type CacheEntry = {
  status: number;
  body: string;
  contentType: string;
  normalized: string;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry>();

function normalizePath(pathJoined: string) {
  return (pathJoined || '').replace(/^\/+/, ''); // no leading slashes
}

function stableQueryString(sp: URLSearchParams | Readonly<URLSearchParams>) {
  const pairs = Array.from(sp.entries())
    .filter(([k]) => k.toLowerCase() !== 'nocache')
    .sort(([a], [b]) => a.localeCompare(b));
  return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

function buildCacheKey(method: string, normalized: string, sp: URLSearchParams | Readonly<URLSearchParams>) {
  const qs = stableQueryString(sp);
  return `${method.toUpperCase()}:${normalized}${qs ? `?${qs}` : ''}`;
}

function getCache(key: string): CacheEntry | null {
  const e = memoryCache.get(key);
  if (!e) return null;
  if (e.expiresAt > Date.now()) return e;
  memoryCache.delete(key);
  return null;
}

function setCache(
  key: string,
  entry: Omit<CacheEntry, 'expiresAt'>,
  ttlMs = DEFAULT_TTL_MS,
) {
  memoryCache.set(key, { ...entry, expiresAt: Date.now() + ttlMs });
}

function invalidateByPath(normalized: string) {
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.normalized === normalized) memoryCache.delete(key);
  }
}

/* ---------------- route handlers ---------------- */
type PathParams = { path?: string[] };

export async function GET(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  return forward(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  return forward(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  return forward(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  return forward(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  return forward(req, ctx);
}

/* ---------------- forwarder with cache ---------------- */
async function forward(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  try {
    // Gate: must be signed in
    try {
      await requireSession();
    } catch (e: any) {
      const status = e?.status || 401;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }

    // Resolve CW base + headers for THIS user/tenant
    const { baseUrl, headers } = await cwHeadersAndBaseForCurrentUser();

    // Params & target URL
    const { path } = await ctx.params; // 👈 await the promise per Next 15
    const rawPath = (path?.join('/') || '').trim();
    const normalized = normalizePath(rawPath);

    const sp = req.nextUrl.searchParams; // ReadonlyURLSearchParams
    const qsRaw = sp.toString();
    const targetUrl = `${baseUrl}/${normalized}${qsRaw ? `?${qsRaw}` : ''}`;

    const bypass = !!sp.get('nocache');
    const isGet = req.method.toUpperCase() === 'GET';

    // Serve from cache for GET
    if (isGet && !bypass) {
      const key = buildCacheKey(req.method, normalized, sp);
      const hit = getCache(key);
      if (hit) {
        return new NextResponse(hit.body, {
          status: hit.status,
          headers: {
            'content-type': hit.contentType,
            'x-cw-cache': 'HIT',
          },
        });
      }
    }

    // Prepare request to CW
    const init: RequestInit = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
      const bodyText = await req.text(); // forward raw body
      if (bodyText) init.body = bodyText;
    }

    // Forward
    const cwResp = await fetch(targetUrl, init);
    const contentType = cwResp.headers.get('content-type') || 'application/json';
    const text = await cwResp.text();

    // Cache successful GETs
    if (isGet && !bypass && cwResp.ok) {
      const key = buildCacheKey(req.method, normalized, sp);
      setCache(key, {
        status: cwResp.status,
        body: text,
        contentType,
        normalized,
      });
    }

    // Invalidate on successful writes
    if (!isGet && cwResp.ok) {
      invalidateByPath(normalized);
    }

    return new NextResponse(text, {
      status: cwResp.status,
      headers: {
        'content-type': contentType,
        'x-cw-cache': isGet ? (bypass ? 'BYPASS' : 'MISS') : 'WRITE',
      },
    });
  } catch (err: any) {
    const message = typeof err?.message === 'string' ? err.message : 'Proxy error';
    const status = /auth|token|unauthor/i.test(message) ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

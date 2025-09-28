// app/api/halo/[...path]/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { getHaloAuthForCurrentUser } from '@/lib/halo';
import { requireFronteggSession } from '@/lib/auth/frontegg';

export const runtime = 'nodejs';

type PathParams = { path?: string[] };

const DEFAULT_TTL_MS =
  Number.isFinite(Number(process.env.HALO_CACHE_TTL_MS))
    ? Number(process.env.HALO_CACHE_TTL_MS)
    : 15 * 60 * 1000;

type CacheEntry = { status: number; body: string; contentType: string; normalized: string; expiresAt: number };
const memoryCache = new Map<string, CacheEntry>();

const norm = (p: string) => (p || '').replace(/^\/+/, '');
const stableQS = (sp: URLSearchParams | Readonly<URLSearchParams>) =>
  Array.from(sp.entries())
    .filter(([k]) => k.toLowerCase() !== 'nocache')
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
const keyOf = (m: string, n: string, sp: URLSearchParams | Readonly<URLSearchParams>) =>
  `${m.toUpperCase()}:${n}${(() => { const s=stableQS(sp); return s?`?${s}`:'' })()}`;

function getCache(key: string) {
  const e = memoryCache.get(key);
  if (!e) return null;
  if (e.expiresAt > Date.now()) return e;
  memoryCache.delete(key);
  return null;
}
function setCache(key: string, entry: Omit<CacheEntry,'expiresAt'>, ttl=DEFAULT_TTL_MS) {
  memoryCache.set(key, { ...entry, expiresAt: Date.now() + ttl });
}
function invalidateByPath(n: string) {
  for (const [k, e] of memoryCache) if (e.normalized === n) memoryCache.delete(k);
}

export async function GET(req: NextRequest, ctx: { params: Promise<PathParams> }) { return forward(req, ctx); }
export async function POST(req: NextRequest, ctx: { params: Promise<PathParams> }) { return forward(req, ctx); }
export async function PATCH(req: NextRequest, ctx: { params: Promise<PathParams> }) { return forward(req, ctx); }
export async function PUT(req: NextRequest, ctx: { params: Promise<PathParams> }) { return forward(req, ctx); }
export async function DELETE(req: NextRequest, ctx: { params: Promise<PathParams> }) { return forward(req, ctx); }

async function forward(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  try {
    await requireFronteggSession(); // gate
    const { baseUrl, accessToken } = await getHaloAuthForCurrentUser();

    const { path } = await ctx.params;
    const raw = (path?.join('/') || '').trim();

    // Halo is case-sensitive: keep your app calling with correct casing like "Client", "Ticket", etc.
    const normalized = norm(raw);

    // Build target: Halo expects /api/... after base
    const sp = req.nextUrl.searchParams;
    const qs = sp.toString();
    const targetUrl = `${baseUrl}/api/${normalized}${qs ? `?${qs}` : ''}`;

    const isGet = req.method === 'GET';
    const bypass = !!sp.get('nocache');

    if (isGet && !bypass) {
      const k = keyOf(req.method, normalized, sp);
      const hit = getCache(k);
      if (hit) {
        return new NextResponse(hit.body, {
          status: hit.status,
          headers: { 'content-type': hit.contentType, 'x-halo-cache': 'HIT' },
        });
      }
    }

    const init: RequestInit = {
      method: req.method,
      headers: {
        'authorization': `Bearer ${accessToken}`,
        'accept': 'application/json',
        // pass through content-type for writes
        ...(req.headers.get('content-type') ? { 'content-type': req.headers.get('content-type')! } : {}),
      },
    };
    if (!['GET','HEAD'].includes(req.method)) {
      const bodyText = await req.text();
      if (bodyText) init.body = bodyText;
    }

    const haloRes = await fetch(targetUrl, init);
    const contentType = haloRes.headers.get('content-type') || 'application/json';
    const text = await haloRes.text();

    if (isGet && !bypass && haloRes.ok) {
      const k = keyOf(req.method, normalized, sp);
      setCache(k, { status: haloRes.status, body: text, contentType, normalized });
    }
    if (!isGet && haloRes.ok) {
      invalidateByPath(normalized);
    }

    // Helpful debug if you’re still getting 403
    if (haloRes.status === 403) {
      console.warn(`[halo-proxy] 403 for ${normalized} -> body: ${text?.slice(0,400)}`);
    }

    return new NextResponse(text, { status: haloRes.status, headers: { 'content-type': contentType } });
  } catch (err: any) {
    const status = err?.status ?? (/unauth|token|forbid/i.test(String(err?.message)) ? 401 : 500);
    return NextResponse.json({ error: err?.message ?? 'Halo proxy error' }, { status });
  }
}

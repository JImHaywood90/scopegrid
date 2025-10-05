import { NextRequest, NextResponse } from 'next/server';
import { requireFronteggSession } from '@/lib/auth/frontegg';
import {
  getSmilebackAccessTokenForCurrentUser,
  invalidateSmilebackTokenForTenant,
} from '@/lib/integrations/getSmilebackAuth';

export const runtime = 'nodejs';

type PathParams = { path?: string[] };

export async function GET(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<PathParams> }) {
  const params = await ctx.params;
  return forward(req, params);
}

async function forward(req: NextRequest, params: PathParams, retry = true) {
  try {
    await requireFronteggSession();

    const { accessToken, apiBaseUrl, feTenantId } = await getSmilebackAccessTokenForCurrentUser();

    const base = apiBaseUrl.replace(/\/+$/, '');
    const normalizedPath = (params.path?.join('/') || '').trim().replace(/^\/+/, '');
    const qs = req.nextUrl.searchParams.toString();
    const targetUrl = `${base}/${normalizedPath}${qs ? `?${qs}` : ''}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    };

    const contentType = req.headers.get('content-type');
    if (contentType) headers['Content-Type'] = contentType;

    const init: RequestInit = { method: req.method, headers };

    if (!['GET', 'HEAD'].includes(req.method)) {
      const text = await req.text();
      if (text) init.body = text;
    }

    const res = await fetch(targetUrl, init);
    if (res.status === 401 && retry) {
      invalidateSmilebackTokenForTenant(feTenantId);
      return forward(req, params, false);
    }

    const responseContentType = res.headers.get('content-type') || 'application/json';
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': responseContentType },
    });
  } catch (err: any) {
    const status = err?.status ?? (/unauth|token/i.test(err?.message) ? 401 : 500);
    return NextResponse.json({ error: err?.message ?? 'SmileBack proxy error' }, { status });
  }
}

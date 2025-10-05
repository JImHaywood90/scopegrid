// api/meraki/[[...path]]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireFronteggSession } from "@/lib/auth/frontegg";
import { getMerakiCredsForCurrentUser } from "@/lib/integrations/getMerakiCreds";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path?: string[] }> }) {
  const params = await ctx.params;
  return forward(req, params);
}

async function forward(req: NextRequest, params: { path?: string[] }) {
  try {
    await requireFronteggSession();

    const { apiKey, baseUrl } = await getMerakiCredsForCurrentUser();

    const normalizedPath = (params.path?.join("/") || "").trim().replace(/^\/+/, "");
    const qs = req.nextUrl.searchParams.toString();
    const targetUrl = `${baseUrl.replace(/\/+$/, "")}/${normalizedPath}${qs ? `?${qs}` : ""}`;

    const init: RequestInit = {
      method: req.method,
      headers: {
        "X-Cisco-Meraki-API-Key": apiKey,
        Accept: "application/json",
      },
    };

    const contentType = req.headers.get("content-type");
    if (contentType) {
      (init.headers as Record<string, string>)["Content-Type"] = contentType;
    }

    if (!['GET', 'HEAD'].includes(req.method)) {
      const body = await req.text();
      if (body) init.body = body;
    }

    const res = await fetch(targetUrl, init);
    const responseContentType = res.headers.get("content-type") || "application/json";
    const text = await res.text();

    return new NextResponse(text, {
      status: res.status,
      headers: { "content-type": responseContentType },
    });
  } catch (err: any) {
    const status = err?.status ?? (/unauth|token/i.test(err?.message) ? 401 : 500);
    return NextResponse.json({ error: err?.message || "Meraki proxy error" }, { status });
  }
}

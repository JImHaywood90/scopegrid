// app/api/backups/[[...path]]/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { requireFronteggSession } from "@/lib/auth/frontegg";
import { getBackupRadarCredsForCurrentUser } from "@/lib/integrations/getBackupRadarCreds";
import { cookies } from "next/headers";


export const runtime = "nodejs";

export async function getSelectedCompanyNameFromCookie(): Promise<string | null> {
  try {
    const cookieValue = (await cookies()).get('sg-company')?.value;
    if (!cookieValue) return null;
    const parsed = JSON.parse(cookieValue);
    return parsed?.name || null;
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  return forward(req, { ...ctx, params });
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  return forward(req, { ...ctx, params });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  return forward(req, { ...ctx, params });
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  return forward(req, { ...ctx, params });
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const params = await ctx.params;
  return forward(req, { ...ctx, params });
}

async function forward(
  req: NextRequest,
  ctx: { params: { path?: string[] } }
) {
  try {
    await requireFronteggSession(); // ensures logged in

    const { baseUrl, apiKey } = await getBackupRadarCredsForCurrentUser();
    console.log("🔑 Got Backup Radar credentials:", baseUrl, apiKey);

    const { path } = ctx.params;
    const normalizedPath = (path?.join("/") || "").trim().replace(/^\/+/, "");
    const qs = req.nextUrl.searchParams.toString();
    const targetUrl = `${baseUrl}/${normalizedPath}${qs ? `?${qs}` : ""}`;

    const init: RequestInit = {
      method: req.method,
      headers: {
        ApiKey: apiKey,
        "Content-Type": "application/json",
      },
    };

    if (!["GET", "HEAD"].includes(req.method)) {
      const bodyText = await req.text();
      if (bodyText) init.body = bodyText;
    }

    const apiResp = await fetch(targetUrl, init);
    const contentType = apiResp.headers.get("content-type") || "application/json";
    const text = await apiResp.text();

    return new NextResponse(text, {
      status: apiResp.status,
      headers: { "content-type": contentType },
    });
  } catch (err: any) {
    const status =
      err?.status ?? (/unauth|token/i.test(err?.message) ? 401 : 500);
    return NextResponse.json(
      { error: err?.message || "Backup Radar proxy error" },
      { status }
    );
  }
}

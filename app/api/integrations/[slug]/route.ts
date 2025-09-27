// app/api/integrations/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return feTenantId;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const feTenantId = await requireFeTenantId();
    const { slug } = await ctx.params;

    const row = await db.query.tenantIntegrations.findFirst({
      where: and(eq(tenantIntegrations.feTenantId, feTenantId), eq(tenantIntegrations.slug, slug)),
    });

    return NextResponse.json({ item: row ?? null });
  } catch (e: any) {
    const status = e?.status ?? 500;
    console.error('GET /api/integrations/[slug] failed:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const feTenantId = await requireFeTenantId();
    const { slug } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const { config = {}, connected } = (body ?? {}) as {
      config?: Record<string, unknown>;
      connected?: boolean;
    };

    const existing = await db.query.tenantIntegrations.findFirst({
      where: and(eq(tenantIntegrations.feTenantId, feTenantId), eq(tenantIntegrations.slug, slug)),
    });

    if (!existing) {
      await db.insert(tenantIntegrations).values({
        feTenantId,
        slug,
        config,
        connected: !!connected,
      });
    } else {
      await db
        .update(tenantIntegrations)
        .set({ config, connected: !!connected, updatedAt: new Date() })
        .where(and(eq(tenantIntegrations.feTenantId, feTenantId), eq(tenantIntegrations.slug, slug)));
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const status = e?.status ?? 500;
    console.error('POST /api/integrations/[slug] failed:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status });
  }
}

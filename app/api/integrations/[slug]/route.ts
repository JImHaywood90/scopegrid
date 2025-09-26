// app/api/integrations/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'No team' }, { status: 403 });

    const slug = params.slug;
    const row = await db.query.tenantIntegrations.findFirst({
      where: and(eq(tenantIntegrations.teamId, team.id), eq(tenantIntegrations.slug, slug)),
    });

    return NextResponse.json({ item: row ?? null });
  } catch (e: any) {
    console.error('GET /api/integrations/[slug] failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'No team' }, { status: 403 });

    const slug = params.slug;
    const body = await req.json().catch(() => ({}));

    // naive validation: require some values; each integration form can supply correct shape
    const { config = {}, connected } = body as { config?: Record<string, unknown>; connected?: boolean };

    // upsert
    const existing = await db.query.tenantIntegrations.findFirst({
      where: and(eq(tenantIntegrations.teamId, team.id), eq(tenantIntegrations.slug, slug)),
    });

    if (!existing) {
      await db.insert(tenantIntegrations).values({
        teamId: team.id,
        slug,
        config,
        connected: !!connected,
      });
    } else {
      await db
        .update(tenantIntegrations)
        .set({ config, connected: !!connected, updatedAt: new Date() })
        .where(and(eq(tenantIntegrations.teamId, team.id), eq(tenantIntegrations.slug, slug)));
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/integrations/[slug] failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

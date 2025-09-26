// app/api/integrations/route.ts
import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema';
import { getTeamForUser } from '@/lib/db/queries';

export async function GET() {
  try {
    const team = await getTeamForUser();
    if (!team) return NextResponse.json({ error: 'No team' }, { status: 403 });

    const rows = await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.teamId, team.id));

    return NextResponse.json({ items: rows });
  } catch (e: any) {
    console.error('GET /api/integrations failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { tenantSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teamId = Number(searchParams.get('teamId'));
  if (!teamId || Number.isNaN(teamId)) return new Response('Invalid teamId', { status: 400 });
  const t = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.teamId, teamId),
    columns: { subdomain: true, cwConfigured: true, onboardingCompleted: true },
  });
  return Response.json(t || null);
}

import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { tenantSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  const { teamId } = await req.json();
  const id = Number(teamId);
  if (!id || Number.isNaN(id)) return new Response('Invalid teamId', { status: 400 });

  const t = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.teamId, id),
    columns: { cwConfigured: true },
  });

  if (!t?.cwConfigured) return new Response('ConnectWise not configured/tested', { status: 400 });

  await db
    .update(tenantSettings)
    .set({ onboardingCompleted: true, updatedAt: new Date() })
    .where(eq(tenantSettings.teamId, id));

  return Response.json({ ok: true });
}

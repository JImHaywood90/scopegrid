import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { tenantSettings } from '@/lib/db/schema';
import { and, eq, or } from 'drizzle-orm';

const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/i;
const RESERVED = new Set(['www','app','api','admin','dashboard','connectwise','scopegrid']);

export async function POST(req: NextRequest) {
  const { teamId, subdomain } = await req.json();
  const id = Number(teamId);
  const sub = String(subdomain || '').toLowerCase();

  if (!id || Number.isNaN(id)) return new Response('Invalid teamId', { status: 400 });
  if (!SUBDOMAIN_REGEX.test(sub) || RESERVED.has(sub)) {
    return new Response('Invalid or reserved subdomain', { status: 400 });
  }

  // ensure unique
  const exists = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.subdomain, sub),
    columns: { id: true, teamId: true },
  });
  if (exists && exists.teamId !== id) {
    return new Response('Subdomain already in use', { status: 409 });
  }

  const now = new Date();

  // upsert by team
  const current = await db.query.tenantSettings.findFirst({
    where: eq(tenantSettings.teamId, id),
    columns: { id: true },
  });

  if (current) {
    await db
      .update(tenantSettings)
      .set({ subdomain: sub, updatedAt: now })
      .where(eq(tenantSettings.teamId, id));
  } else {
    await db.insert(tenantSettings).values({
      teamId: id,
      subdomain: sub,
      cwConfigured: false,
      onboardingCompleted: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  return Response.json({ ok: true, subdomain: sub });
}

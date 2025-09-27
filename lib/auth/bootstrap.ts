// lib/auth/bootstrap.ts
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { tenants, appUsers, tenantSettings } from '@/lib/db/schema.v2';
import { and, eq } from 'drizzle-orm';

export type BootstrapResult = {
  feTenantId: string;
  feUserId: string;
};

export async function bootstrapFromFrontegg(): Promise<BootstrapResult> {
  const session = await getAppSession();
  if (!session) throw Object.assign(new Error('Unauthorized'), { status: 401 });

  const feTenantId =
    session.user?.tenantId ??
    (session.user as any)?.tenantId ??
    (session.user as any)?.tenantIds?.[0];

  if (!feTenantId) throw Object.assign(new Error('Missing tenant'), { status: 403 });

  const feUserId = (session.user as any)?.id ?? (session.user as any)?.sub;
  const email = (session.user as any)?.email ?? null;
  const name = (session.user as any)?.name ?? null;

  // Upsert tenant
  let t = await db.query.tenants.findFirst({ where: eq(tenants.feTenantId, feTenantId) });
  if (!t) {
    const [inserted] = await db.insert(tenants)
      .values({ feTenantId, name: session.user?.name ?? null })
      .returning();
    t = inserted;
  }

  // Ensure tenantSettings row
  let ts = await db.query.tenantSettings.findFirst({ where: eq(tenantSettings.feTenantId, feTenantId) });
  if (!ts) {
    await db.insert(tenantSettings).values({ feTenantId });
  }

  // Upsert app user
  const existingUser = await db.query.appUsers.findFirst({ where: eq(appUsers.feUserId, feUserId) });
  if (!existingUser) {
    await db.insert(appUsers).values({ feUserId, email, name });
  } else if (existingUser.email !== email || existingUser.name !== name) {
    await db.update(appUsers)
      .set({ email, name })
      .where(eq(appUsers.feUserId, feUserId));
  }

  return { feTenantId, feUserId };
}

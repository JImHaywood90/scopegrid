// lib/auth/withTenant.ts
'use server';

import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { tenants } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';

export type TenantRow = typeof tenants.$inferSelect;

export async function requireTenant(): Promise<{
  feTenantId: string;
  user: any;
  tenant: TenantRow | null;
}> {
  const session = await getAppSession();
  if (!session) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  const feTenantId =
    session.user?.tenantId ??
    (session.user as any)?.tenantId ??
    (session.user as any)?.tenantIds?.[0];

  if (!feTenantId) {
    throw Object.assign(new Error('No tenant in session'), { status: 403 });
  }

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.feTenantId, feTenantId),
  });

  return { feTenantId, user: session.user, tenant: tenant ?? null };
}

/**
 * Drop-in replacement for withTeam server-action wrapper
 */
export function withTenant<
  R = void
>(fn: (formData: FormData, ctx: { feTenantId: string; user: any; tenant: TenantRow | null }) => Promise<R>) {
  return async (formData: FormData) => {
    const ctx = await requireTenant();
    return fn(formData, ctx);
  };
}

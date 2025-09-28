// lib/psa.ts
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials, haloCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';

export type PsaKind = 'cw' | 'halo';

export async function getFronteggTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

export async function getPsaKindForTenant(): Promise<PsaKind> {
  const feTenantId = await getFronteggTenantId();

  const halo = await db.query.haloCredentials.findFirst({
    where: eq(haloCredentials.feTenantId, feTenantId),
    columns: { feTenantId: true },
  });
  if (halo) return 'halo';

  const cw = await db.query.connectwiseCredentials.findFirst({
    where: eq(connectwiseCredentials.feTenantId, feTenantId),
    columns: { feTenantId: true },
  });
  if (cw) return 'cw';

  throw Object.assign(new Error('No PSA configured'), { status: 403 });
}

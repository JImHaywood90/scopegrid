// app/api/psa/info/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials, haloCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getAppSession();
  const feTenantId =
    session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [cw, halo] = await Promise.all([
    db.query.connectwiseCredentials.findFirst({ where: eq(connectwiseCredentials.feTenantId, feTenantId) }),
    db.query.haloCredentials?.findFirst?.({ where: eq(haloCredentials.feTenantId, feTenantId) }),
  ]);

  const kind = halo ? 'halo' : cw ? 'connectwise' : null;
  return NextResponse.json({ kind });
}

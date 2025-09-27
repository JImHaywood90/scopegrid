// app/api/connectwise/credentials/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function GET() {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const feTenantId =
    session.user?.tenantId ??
    (session.user as any)?.tenantId ??
    (session.user as any)?.tenantIds?.[0];

  if (!feTenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

  const row = await db.query.connectwiseCredentials.findFirst({
    where: eq(connectwiseCredentials.feTenantId, feTenantId),
  });

  return NextResponse.json({
    siteUrl: row?.siteUrl ?? '',
    hasCreds: !!row,
  });
}

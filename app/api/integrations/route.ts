// app/api/integrations/route.ts
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';

export const runtime = 'nodejs';

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }
  return feTenantId;
}

export async function GET() {
  try {
    const feTenantId = await requireFeTenantId();

    const rows = await db
      .select()
      .from(tenantIntegrations)
      .where(eq(tenantIntegrations.feTenantId, feTenantId));

    const items = rows.map(({ slug, connected, createdAt, updatedAt }) => ({
      slug,
      connected,
      createdAt,
      updatedAt,
    }));

    return NextResponse.json({ items });
  } catch (e: any) {
    const status = e?.status ?? 500;
    console.error('GET /api/integrations failed:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status });
  }
}

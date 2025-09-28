import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { tenantSettings } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const session = await getAppSession();
    const feTenantId =
      session?.user?.tenantId || (session?.user as any)?.tenantIds?.[0];
    if (!feTenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await db
      .update(tenantSettings)
      .set({ onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(tenantSettings.feTenantId, feTenantId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/onboarding/complete failed:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

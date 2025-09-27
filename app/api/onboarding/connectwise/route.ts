// app/api/onboarding/connectwise/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials, tenantSettings } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { encryptString } from '@/lib/crypto';

export const runtime = 'nodejs';

function getFeTenantIdFromSession(session: any): string | null {
  return (
    session?.user?.tenantId ??
    session?.tenant?.tenantId ??
    session?.user?.tenantIds?.[0] ??
    null
  );
}

export async function POST(req: Request) {
  try {
    const session = await getAppSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const feTenantId = getFeTenantIdFromSession(session);
    if (!feTenantId) return NextResponse.json({ error: 'No tenant' }, { status: 403 });

    const { siteUrl, companyId, publicKey, privateKey } = await req.json();

    if (!siteUrl || !companyId || !publicKey || !privateKey) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const site = String(siteUrl).replace(/\/+$/, '');

    await db
      .insert(connectwiseCredentials)
      .values({
        feTenantId,                // 👈 PK column
        siteUrl: site,
        companyIdEnc: encryptString(companyId),
        publicKeyEnc: encryptString(publicKey),
        privateKeyEnc: encryptString(privateKey),
      })
      .onConflictDoUpdate({
        target: connectwiseCredentials.feTenantId,
        set: {
          siteUrl: site,
          companyIdEnc: encryptString(companyId),
          publicKeyEnc: encryptString(publicKey),
          privateKeyEnc: encryptString(privateKey),
          updatedAt: new Date(),
        },
      });

    await db
      .update(tenantSettings)
      .set({ cwConfigured: true, onboardingCompleted: true, updatedAt: new Date() })
      .where(eq(tenantSettings.feTenantId, feTenantId));

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('POST /api/onboarding/connectwise failed:', e);
    return NextResponse.json({ error: e?.message ?? 'Internal error' }, { status: 500 });
  }
}

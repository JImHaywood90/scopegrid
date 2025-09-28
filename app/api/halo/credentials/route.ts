// app/api/halo/credentials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { haloCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { encryptString } from '@/lib/crypto';

export const runtime = 'nodejs';

async function requireFeTenantId() {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

export async function GET() {
  try {
    const feTenantId = await requireFeTenantId();
    const row = await db.query.haloCredentials.findFirst({
      where: eq(haloCredentials.feTenantId, feTenantId),
      columns: {
        feTenantId: true,
        baseUrl: true,
        scope: true,
        // never return secrets
        clientIdEnc: false,
        clientSecretEnc: false,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(row ?? { feTenantId, hasCreds: false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: e?.status ?? 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const feTenantId = await requireFeTenantId();
    const body = await req.json().catch(() => ({}));
    const { baseUrl, clientId, clientSecret, scope = 'all' } = body as {
      baseUrl?: string;
      clientId?: string;
      clientSecret?: string;
      scope?: string;
    };

    if (!baseUrl || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'baseUrl, clientId, clientSecret required' }, { status: 400 });
    }

    const base = String(baseUrl).replace(/\/+$/, '');
    await db
      .insert(haloCredentials)
      .values({
        feTenantId,
        baseUrl: base,
        clientIdEnc: encryptString(clientId),
        clientSecretEnc: encryptString(clientSecret),
        scope,
      })
      .onConflictDoUpdate({
        target: haloCredentials.feTenantId,
        set: {
          baseUrl: base,
          clientIdEnc: encryptString(clientId),
          clientSecretEnc: encryptString(clientSecret),
          scope,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: e?.status ?? 500 });
  }
}

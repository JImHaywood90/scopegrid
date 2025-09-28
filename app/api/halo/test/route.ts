// app/api/halo/test/route.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';
import { db } from '@/lib/db/drizzle';
import { haloCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

export const runtime = 'nodejs';

async function requireFeTenantId() {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

export async function POST() {
  try {
    const feTenantId = await requireFeTenantId();
    const row = await db.query.haloCredentials.findFirst({
      where: eq(haloCredentials.feTenantId, feTenantId),
    });
    if (!row) return NextResponse.json({ error: 'No Halo credentials' }, { status: 400 });

    const tokenUrl = `${row.baseUrl.replace(/\/+$/, '')}/auth/token`;

    // OAuth 2.0 client_credentials (Halo supports client_id / client_secret / scope)
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: decryptString(row.clientIdEnc),
        client_secret: decryptString(row.clientSecretEnc),
        scope: row.scope || 'all',
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return NextResponse.json({ error: `Token failed ${res.status}: ${txt}` }, { status: 400 });
    }
    const json = await res.json();
    // json.access_token, json.expires_in, json.token_type (typically "Bearer")
    if (!json?.access_token) {
      return NextResponse.json({ error: 'No access_token in response' }, { status: 400 });
    }

    // Optional: make a trivial GET to API to validate token further (commented for now)
    // const apiRes = await fetch(`${row.baseUrl}/api/some-lightweight-resource`, {
    //   headers: { authorization: `Bearer ${json.access_token}` }
    // });
    // if (!apiRes.ok) return NextResponse.json({ error: 'API ping failed'}, { status: 400 });

    return NextResponse.json({ ok: true, expires_in: json.expires_in });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Error' }, { status: e?.status ?? 500 });
  }
}

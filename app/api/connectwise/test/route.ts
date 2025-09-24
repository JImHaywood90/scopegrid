import { NextRequest } from 'next/server';

import { connectwiseCredentials, tenantSettings } from '@/lib/db/schema';
import { decryptString } from '@/lib/crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';

function buildHeaders(companyId: string, publicKey: string, privateKey: string) {
  const auth = Buffer.from(`${companyId}+${publicKey}:${privateKey}`).toString('base64');
  return {
    Authorization: `Basic ${auth}`,
    clientId: process.env.CW_CLIENT_ID || '',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function POST(req: NextRequest) {
  const { teamId } = await req.json();
  if (!teamId) return new Response('Missing teamId', { status: 400 });

  const [row] = await db
    .select()
    .from(connectwiseCredentials)
    .where(eq(connectwiseCredentials.teamId, teamId))
    .limit(1);

  if (!row) return new Response('No credentials found', { status: 404 });
  if (!process.env.CW_CLIENT_ID) return new Response('CW_CLIENT_ID missing', { status: 500 });

  const siteUrl = row.siteUrl.replace(/\/$/, '');
  const companyId = decryptString(row.companyIdEnc);
  const publicKey = decryptString(row.publicKeyEnc);
  const privateKey = decryptString(row.privateKeyEnc);

  const url = `/api/connectwise/service/tickets?pageSize=1`;
  const res = await fetch(url, { headers: buildHeaders(companyId, publicKey, privateKey), cache: 'no-store' });

if (res.ok) {
  // mark tenant CW configured if a settings row exists
  await db
    .update(tenantSettings)
    .set({ cwConfigured: true, updatedAt: new Date() })
    .where(eq(tenantSettings.teamId, teamId));
  return Response.json({ ok: true });
} else {
    const text = await res.text().catch(() => '');
    return new Response(text || 'ConnectWise test failed', { status: res.status || 500 });
  }
}

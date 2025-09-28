// lib/halo.ts
import { db } from '@/lib/db/drizzle';
import { haloCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';
import { decryptString } from './crypto';

type TokenCache = { accessToken: string; expiresAt: number };
const memory = new Map<string, TokenCache>(); // key = feTenantId

async function getTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return feTenantId;
}

export async function getHaloAuthForCurrentUser() {
  const feTenantId = await getTenantId();

  // read creds from DB
  const row = await db.query.haloCredentials.findFirst({
    where: eq(haloCredentials.feTenantId, feTenantId),
  });
  if (!row) throw Object.assign(new Error('Halo not configured'), { status: 403 });

  const baseUrl = row.baseUrl.replace(/\/+$/, ''); // e.g. https://solacedev.halopsa.com
  const tokenKey = feTenantId;

  const cached = memory.get(tokenKey);
  if (cached && cached.expiresAt > Date.now() + 5000) { // 5s skew
    return { baseUrl, accessToken: cached.accessToken };
  }

  // fetch a fresh token
  const form = new URLSearchParams();
  form.set('grant_type', 'client_credentials');
  form.set('client_id', decryptString(row.clientIdEnc));
  form.set('client_secret', decryptString(row.clientSecretEnc));
  form.set('scope', 'all');

  const tokenRes = await fetch(`${baseUrl}/auth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(()=>'');
    throw Object.assign(new Error(`Halo token failed: ${tokenRes.status} ${txt}`), { status: 502 });
  }
  const json = await tokenRes.json() as { access_token: string; token_type: string; expires_in: number };
  const accessToken = json.access_token;
  const expiresAt = Date.now() + (json.expires_in ?? 3600) * 1000;

  memory.set(tokenKey, { accessToken, expiresAt });

  return { baseUrl, accessToken };
}

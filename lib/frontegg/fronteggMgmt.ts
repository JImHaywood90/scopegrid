// lib/fronteggMgmt.ts
const FE_VENDOR_BASE =
  process.env.FRONTEGG_VENDOR_BASE ?? 'https://api.frontegg.com';
const FRONTEGG_CLIENT_ID = process.env.FRONTEGG_CLIENT_ID!;
const FRONTEGG_CLIENT_SECRET = process.env.FRONTEGG_CLIENT_SECRET!;

export async function getMgmtToken() {
  const clientId = process.env.FRONTEGG_CLIENT_ID!;
  const secret   = process.env.FRONTEGG_API_KEY!;
  if (!clientId || !secret) throw new Error('Missing FRONTEGG_CLIENT_ID or FRONTEGG_API_KEY');

  const r = await fetch('https://api.frontegg.com/auth/vendor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ clientId, secret }),
  });
  if (!r.ok) {
    throw new Error(`frontegg vendor token: ${r.status} ${await r.text()}`);
  }
  const j = await r.json() as { token?: string; accessToken?: string; access_token?: string };
  const token = j.access_token || j.accessToken || j.token;
  if (!token) throw new Error('frontegg vendor token: no token in response');
  return token;
}

/** Get vendor (client-credentials) token from api.frontegg.com */
export async function getVendorToken(): Promise<string> {
  const r = await fetch(`${FE_VENDOR_BASE}/auth/vendor`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      clientId: FRONTEGG_CLIENT_ID,
      secret: FRONTEGG_CLIENT_SECRET,
      scope: 'fr_manage:all',
    }),
  });
  if (!r.ok) throw new Error(`vendor token failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  if (!j?.access_token) throw new Error('vendor token missing access_token');
  return j.access_token as string;
}

/** Create a tenant (returns tenant id) */
export async function createTenant(name: string, externalId?: string) {
  const token = await getVendorToken();
  const r = await fetch(`${FE_VENDOR_BASE}/identity/resources/tenants/v1`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, externalId }),
  });
  if (!r.ok) throw new Error(`create tenant failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data?.id as string;
}

/** Create a user and attach to tenant */
export async function createUserInTenant(args: {
  tenantId: string;
  email: string;
  name?: string;
  skipEmailVerification?: boolean;
}) {
  const token = await getVendorToken();
  const r = await fetch(`${FE_VENDOR_BASE}/identity/resources/users/v2`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      email: args.email,
      name: args.name ?? args.email,
      tenantId: args.tenantId,
      skipEmailVerification: args.skipEmailVerification ?? true,
    }),
  });
  if (!r.ok) throw new Error(`create user failed: ${r.status} ${await r.text()}`);
  return r.json();
}

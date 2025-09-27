// lib/connectwise.ts
import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials } from '@/lib/db/schema.v2';
import { eq } from 'drizzle-orm';
import { getAppSession } from '@frontegg/nextjs/app';
import { decryptString } from '@/lib/crypto';

export async function cwHeadersAndBaseForCurrentUser() {
  const session = await getAppSession();
  const feTenantId =
    session?.user?.tenantId ??
    (session as any)?.tenant?.tenantId ??
    (session?.user as any)?.tenantIds?.[0];

  if (!feTenantId) {
    const e: any = new Error('No tenant');
    e.status = 403;
    throw e;
  }

  const row = await db.query.connectwiseCredentials.findFirst({
    where: eq(connectwiseCredentials.feTenantId, feTenantId),
  });
  if (!row) {
    const e: any = new Error('ConnectWise not configured for tenant');
    e.status = 412;
    throw e;
  }

  const siteUrl = row.siteUrl.replace(/\/+$/, '');
  const baseUrl = `${siteUrl}/v4_6_release/apis/3.0`;

  const companyId = decryptString(row.companyIdEnc);
  const pub = decryptString(row.publicKeyEnc);
  const priv = decryptString(row.privateKeyEnc);

  const cwClientId = process.env.CW_CLIENT_ID;
  if (!cwClientId) {
    const e: any = new Error('Missing CW_CLIENT_ID env');
    e.status = 500;
    throw e;
  }

  const headers: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    clientId: cwClientId,
    Authorization: `Basic ${Buffer.from(`${companyId}+${pub}:${priv}`).toString('base64')}`,
  };

  return { baseUrl, headers, feTenantId };
}

import { db } from '@/lib/db/drizzle';
import { connectwiseCredentials, teamMembers } from '@/lib/db/schema';
import { decryptString } from '@/lib/crypto';
import { eq } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

function buildBasic(companyId: string, publicKey: string, privateKey: string) {
  // Basic base64("companyId+publicKey:privateKey")
  return Buffer.from(`${companyId}+${publicKey}:${privateKey}`).toString('base64');
}

export async function cwHeadersAndBaseForCurrentUser() {
  const user = await getUser();
  if (!user) {
    const err = new Error('Unauthorized');
    (err as any).status = 401;
    throw err;
  }

  // Get user's primary team (first membership)
  const membership = await db.query.teamMembers.findFirst({
    where: eq(teamMembers.userId, user.id),
    columns: { teamId: true },
  });
  if (!membership?.teamId) {
    const err = new Error('No team for user');
    (err as any).status = 403;
    throw err;
  }

  // Load that team's CW creds
  const creds = await db.query.connectwiseCredentials.findFirst({
    where: eq(connectwiseCredentials.teamId, membership.teamId),
  });
  if (!creds) {
    const err = new Error('ConnectWise not configured');
    (err as any).status = 400;
    throw err;
  }

  const siteUrl = creds.siteUrl.replace(/\/$/, '');
  const siteUrlFull = siteUrl + '/v4_6_release/apis/3.0';
  const companyId = decryptString(creds.companyIdEnc);
  const publicKey = decryptString(creds.publicKeyEnc);
  const privateKey = decryptString(creds.privateKeyEnc);

  const headers = new Headers();
  headers.set('Authorization', `Basic ${buildBasic(companyId, publicKey, privateKey)}`);
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');

  // CW Manage REST requires a ClientId header
  const clientId = process.env.CW_CLIENT_ID;
  if (!clientId) {
    // You can throw if you prefer:
    // throw new Error('CW_CLIENT_ID missing');
  } else {
    headers.set('clientId', clientId);
  }

  return { baseUrl: siteUrlFull, headers };
}

import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

export async function getBackupRadarCredsForCurrentUser() {
      console.log("HIT BR creds:");
  const session = await getAppSession();
  const feTenantId =
    session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  console.log("BR Session:", session);
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const row = await db.query.tenantIntegrations.findFirst({
    where: and(
      eq(tenantIntegrations.feTenantId, feTenantId),
      eq(tenantIntegrations.slug, 'backupradar')
    ),
  });

  if (!row || !row.config || !row.connected) {
    throw Object.assign(new Error('Backup Radar not connected'), { status: 400 });
  }

  let creds: Record<string, any> = row.config as any;
  if (typeof (row.config as any)?.__encrypted === 'string') {
    try {
      creds = JSON.parse(decryptString((row.config as any).__encrypted));
    } catch (err) {
      console.error('Failed to decrypt Backup Radar config', err);
      throw Object.assign(new Error('Unable to decrypt Backup Radar credentials'), { status: 500 });
    }
  }

  const { baseUrl, apiKey } = creds ?? {};

  if (!baseUrl || !apiKey) {
    throw Object.assign(new Error('Missing Backup Radar credentials'), { status: 400 });
  }

  return {
    baseUrl: String(baseUrl).replace(/\/+$/, ''), // normalize
    apiKey: String(apiKey),
  };
}

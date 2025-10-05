import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

export async function getMerakiCredsForCurrentUser() {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const row = await db.query.tenantIntegrations.findFirst({
    where: and(
      eq(tenantIntegrations.feTenantId, feTenantId),
      eq(tenantIntegrations.slug, 'meraki')
    ),
  });

  if (!row || !row.config || !row.connected) {
    throw Object.assign(new Error('Meraki not connected'), { status: 400 });
  }

  let config: Record<string, any> = row.config as any;
  if (typeof (row.config as any)?.__encrypted === 'string') {
    try {
      config = JSON.parse(decryptString((row.config as any).__encrypted));
    } catch (err) {
      console.error('Failed to decrypt Meraki config', err);
      throw Object.assign(new Error('Unable to decrypt Meraki credentials'), { status: 500 });
    }
  }

  const apiKey = config?.apiKey;
  const baseUrl = config?.baseUrl || 'https://api.meraki.com/api/v1';

  if (!apiKey) {
    throw Object.assign(new Error('Missing Meraki API key'), { status: 400 });
  }

  return {
    apiKey: String(apiKey),
    baseUrl: String(baseUrl).replace(/\/+$/, ''),
    rawConfig: config,
  };
}

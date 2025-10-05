import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

export type AuvikConfig = {
  baseUrl?: string;
  username?: string;
  apiKey?: string;
};

function sanitizeBaseUrl(raw?: string) {
  const fallback = 'https://auvikapi.us1.my.auvik.com';
  if (!raw) return fallback;
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return `${url.origin}${url.pathname.replace(/\/$/, '') || ''}`;
  } catch {
    return fallback;
  }
}

export async function getAuvikCredsForCurrentUser() {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const row = await db.query.tenantIntegrations.findFirst({
    where: and(
      eq(tenantIntegrations.feTenantId, feTenantId),
      eq(tenantIntegrations.slug, 'auvik')
    ),
  });

  if (!row || !row.config || !row.connected) {
    throw Object.assign(new Error('Auvik not connected'), { status: 400 });
  }

  let config: AuvikConfig = row.config as any;
  if (typeof (row.config as any)?.__encrypted === 'string') {
    try {
      config = JSON.parse(decryptString((row.config as any).__encrypted));
    } catch (err) {
      console.error('Failed to decrypt Auvik config', err);
      throw Object.assign(new Error('Unable to decrypt Auvik credentials'), {
        status: 500,
      });
    }
  }

  const baseUrl = sanitizeBaseUrl(config?.baseUrl);
  const username = config?.username?.trim?.();
  const apiKey = config?.apiKey?.trim?.();

  if (!username || !apiKey) {
    throw Object.assign(new Error('Missing Auvik API credentials'), { status: 400 });
  }

  return {
    feTenantId,
    baseUrl,
    username,
    apiKey,
  } as const;
}

import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

export type CippConfig = {
  baseUrl?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  scope?: string;
};

const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

function sanitizeBaseUrl(raw?: string) {
  if (!raw || typeof raw !== 'string') return 'https://cipp.app';
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    try {
      const url = new URL(`https://${raw}`);
      return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
    } catch {
      return 'https://cipp.app';
    }
  }
}

export async function getCippConfigForCurrentUser() {
  const session = await getAppSession();
  const feTenantId =
    session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const row = await db.query.tenantIntegrations.findFirst({
    where: and(
      eq(tenantIntegrations.feTenantId, feTenantId),
      eq(tenantIntegrations.slug, 'cipp')
    ),
  });

  if (!row || !row.config || !row.connected) {
    throw Object.assign(new Error('CIPP not connected'), { status: 400 });
  }

  let config: CippConfig = row.config as any;
  if (typeof (row.config as any)?.__encrypted === 'string') {
    try {
      config = JSON.parse(decryptString((row.config as any).__encrypted));
    } catch (err) {
      console.error('Failed to decrypt CIPP config', err);
      throw Object.assign(new Error('Unable to decrypt CIPP credentials'), {
        status: 500,
      });
    }
  }

  const baseUrl = sanitizeBaseUrl(config?.baseUrl);
  const tenantId = config?.tenantId?.trim?.();
  const clientId = config?.clientId?.trim?.();
  const clientSecret = config?.clientSecret?.trim?.();
  const scope = config?.scope?.trim?.();

  if (!tenantId || !clientId || !clientSecret) {
    throw Object.assign(new Error('Incomplete CIPP credentials'), {
      status: 400,
    });
  }

  return {
    feTenantId,
    config: {
      baseUrl,
      tenantId,
      clientId,
      clientSecret,
      scope: scope || `api://${clientId}/.default`,
    },
  } as const;
}

async function requestAccessToken(args: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  scope: string;
}) {
  const tokenUrl = `https://login.microsoftonline.com/${args.tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: args.clientSecret,
    scope: args.scope,
    grant_type: 'client_credentials',
  }).toString();

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(text || 'CIPP token request failed'), {
      status: res.status,
    });
  }

  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;

  if (!json?.access_token) {
    throw Object.assign(new Error('CIPP token response missing access_token'), {
      status: 500,
    });
  }

  const expiresIn = Number(json.expires_in ?? 3600);
  const expiresAt = Date.now() + Math.max(0, expiresIn - 60) * 1000;

  return { accessToken: json.access_token, expiresAt };
}

export async function getCippAccessTokenForCurrentUser() {
  const { feTenantId, config } = await getCippConfigForCurrentUser();
  const cached = tokenCache.get(feTenantId);
  if (cached && cached.expiresAt > Date.now() + 5000) {
    return {
      feTenantId,
      accessToken: cached.accessToken,
      apiBaseUrl: config.baseUrl,
      config,
    } as const;
  }

  const token = await requestAccessToken({
    tenantId: config.tenantId!,
    clientId: config.clientId!,
    clientSecret: config.clientSecret!,
    scope: config.scope!,
  });

  tokenCache.set(feTenantId, token);

  return {
    feTenantId,
    accessToken: token.accessToken,
    apiBaseUrl: config.baseUrl,
    config,
  } as const;
}

export function invalidateCippTokenForTenant(feTenantId: string) {
  tokenCache.delete(feTenantId);
}

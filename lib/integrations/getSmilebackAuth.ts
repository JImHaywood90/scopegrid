import { db } from '@/lib/db/drizzle';
import { tenantIntegrations } from '@/lib/db/schema.v2';
import { getAppSession } from '@frontegg/nextjs/app';
import { and, eq } from 'drizzle-orm';
import { decryptString } from '@/lib/crypto';

const tokenCache = new Map<string, { accessToken: string; expiresAt: number }>();

export type SmilebackConfig = {
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  username?: string;
  password?: string;
};

function sanitizeBaseUrl(raw?: string | null) {
  const fallback = 'https://app.smileback.io/api/v3';
  if (!raw || typeof raw !== 'string') return fallback;
  try {
    const url = new URL(raw);
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}` || fallback;
  } catch {
    // Attempt to fix missing scheme
    try {
      const url = new URL(`https://${raw}`);
      return `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
    } catch {
      return fallback;
    }
  }
}

function resolveTokenUrl(apiBase: string) {
  try {
    const url = new URL(apiBase);
    return `${url.origin}/api/token/`;
  } catch {
    return 'https://app.smileback.io/api/token/';
  }
}

export async function getSmilebackConfigForCurrentUser() {
  const session = await getAppSession();
  const feTenantId = session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 });
  }

  const row = await db.query.tenantIntegrations.findFirst({
    where: and(eq(tenantIntegrations.feTenantId, feTenantId), eq(tenantIntegrations.slug, 'smileback')),
  });

  if (!row || !row.config || !row.connected) {
    throw Object.assign(new Error('SmileBack not connected'), { status: 400 });
  }

  let config: SmilebackConfig = row.config as any;
  if (typeof (row.config as any)?.__encrypted === 'string') {
    try {
      config = JSON.parse(decryptString((row.config as any).__encrypted));
    } catch (err) {
      console.error('Failed to decrypt SmileBack config', err);
      throw Object.assign(new Error('Unable to decrypt SmileBack credentials'), { status: 500 });
    }
  }

  const baseUrl = sanitizeBaseUrl(config?.baseUrl);
  const clientId = config?.clientId?.trim?.();
  const clientSecret = config?.clientSecret?.trim?.();
  const username = config?.username?.trim?.();
  const password = config?.password?.trim?.();

  if (!clientId || !clientSecret || !username || !password) {
    throw Object.assign(new Error('Incomplete SmileBack credentials'), { status: 400 });
  }

  return {
    feTenantId,
    config: {
      baseUrl,
      clientId,
      clientSecret,
      username,
      password,
      tokenUrl: resolveTokenUrl(baseUrl),
    },
  };
}

async function requestAccessToken(args: {
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}) {
  const { tokenUrl, clientId, clientSecret, username, password } = args;
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'password',
    scope: 'read read_recent',
    username,
    password,
  }).toString();

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'content-type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(text || 'SmileBack token request failed'), { status: res.status });
  }

  const json = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
  if (!json?.access_token) {
    throw Object.assign(new Error('SmileBack token response missing access_token'), { status: 500 });
  }

  const expiresIn = Number(json.expires_in ?? 3600);
  const expiresAt = Date.now() + Math.max(0, expiresIn - 30) * 1000;

  return { accessToken: json.access_token, expiresAt };
}

export async function getSmilebackAccessTokenForCurrentUser() {
  const { feTenantId, config } = await getSmilebackConfigForCurrentUser();
  const cached = tokenCache.get(feTenantId);
  if (cached && cached.expiresAt > Date.now() + 5000) {
    return { feTenantId, accessToken: cached.accessToken, apiBaseUrl: config.baseUrl };
  }

  const token = await requestAccessToken({
    tokenUrl: "http://localhost:3002/smileback/api/token",
    clientId: config.clientId!,
    clientSecret: config.clientSecret!,
    username: config.username!,
    password: config.password!,
  });

  tokenCache.set(feTenantId, token);

  return { feTenantId, accessToken: token.accessToken, apiBaseUrl: config.baseUrl };
}

export function invalidateSmilebackTokenForTenant(feTenantId: string) {
  tokenCache.delete(feTenantId);
}

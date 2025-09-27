// lib/auth/frontegg.ts
import { NextResponse } from 'next/server';
import { getAppSession } from '@frontegg/nextjs/app';

/**
 * Ensures a Frontegg session exists. Throws an object with { status } on failure,
 * so route handlers can return a typed 401/403 easily.
 */
export async function requireFronteggSession() {
  const session = await getAppSession();
  if (!session) {
    const err: any = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }
  return session;
}

/** Convenience helpers */
export async function getCurrentUser() {
  const s = await requireFronteggSession();
  return s.user; // { id, email, name, tenantId, ... }
}

export async function getCurrentTenantId(): Promise<string> {
  const s = await requireFronteggSession();
  const tenantId = s.user?.tenantId ?? s.user?.tenantId ?? s.user?.tenantIds?.[0];
  if (!tenantId) {
    const err: any = new Error('No tenant in session');
    err.status = 403;
    throw err;
  }
  return tenantId;
}

/** Shorthand to return a 401 JSON quickly */
export function unauthorizedJson() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

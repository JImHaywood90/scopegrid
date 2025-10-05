import { NextRequest, NextResponse } from 'next/server';
import { requireFronteggSession } from '@/lib/auth/frontegg';
import { cwHeadersAndBaseForCurrentUser } from '@/lib/connectwise';

export const runtime = 'nodejs';

const GENERIC_DOMAINS = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'live.com',
  'aol.com',
]);

async function fetchAllContacts(baseUrl: string, headers: Record<string, string>, identifier: string) {
  const contacts: any[] = [];
  const pageSize = 1000;
  let page = 1;

  while (true) {
    const url = new URL(`${baseUrl}/company/contacts`);
    url.searchParams.set(
      'conditions',
      `company/identifier="${identifier}" and inactiveFlag=false`
    );
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));

    const res = await fetch(url.toString(), { headers, cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw Object.assign(new Error(text || 'ConnectWise contacts request failed'), {
        status: res.status,
      });
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    contacts.push(...data);
    if (data.length < pageSize) break;
    page += 1;
  }

  return contacts;
}

async function fetchCompanyWebsite(baseUrl: string, headers: Record<string, string>, identifier: string) {
  const url = new URL(`${baseUrl}/company/companies`);
  url.searchParams.set('conditions', `identifier="${identifier}"`);
  url.searchParams.set('pageSize', '1');

  const res = await fetch(url.toString(), { headers, cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const company = data[0] ?? {};
  const website = company?.webSite ?? company?.website ?? company?.defaultSiteUrl;
  if (!website || typeof website !== 'string') return null;
  try {
    const parsed = new URL(website.startsWith('http') ? website : `https://${website}`);
    return parsed.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

function extractEmails(contact: any): string[] {
  const emails = new Set<string>();

  const push = (value: unknown) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim().toLowerCase();
    if (trimmed && trimmed.includes('@')) emails.add(trimmed);
  };

  push(contact?.email);
  push(contact?.emailAddress);
  push(contact?.primaryEmailAddress);

  if (Array.isArray(contact?.communicationItems)) {
    for (const item of contact.communicationItems) {
      const type = (item?.type ?? item?.communicationType ?? '').toString().toLowerCase();
      if (type.includes('email')) push(item?.value ?? item?.address);
    }
  }

  if (Array.isArray(contact?.phones)) {
    for (const phone of contact.phones) {
      const type = (phone?.type ?? '').toString().toLowerCase();
      if (type.includes('email')) push(phone?.value ?? phone?.address);
    }
  }

  if (Array.isArray(contact?.customFields)) {
    for (const field of contact.customFields) {
      if (!field) continue;
      push(field?.value);
    }
  }

  return Array.from(emails);
}

function pickPrimaryDomain(emails: string[], fallbackDomains: string[] = []) {
  const counts = new Map<string, number>();

  const tally = (domain: string) => {
    const key = domain.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };

  for (const email of emails) {
    const domain = email.split('@')[1];
    if (!domain) continue;
    tally(domain);
  }

  fallbackDomains.forEach((domain, idx) => {
    if (!domain) return;
    const key = domain.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + Math.max(1, fallbackDomains.length - idx));
  });

  const candidates = Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));

  const nonGeneric = candidates.find((entry) => !GENERIC_DOMAINS.has(entry.domain));
  const primary = nonGeneric ?? candidates[0];

  return {
    primaryDomain: primary?.domain ?? null,
    candidates,
  };
}

async function resolveTenantId(domain: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${domain}/v2.0/.well-known/openid-configuration`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const issuer = data?.issuer;
    if (typeof issuer === 'string') {
      const parts = issuer.split('/');
      const tenant = parts[3];
      if (tenant && tenant.length === 36) return tenant;
    }
    return null;
  } catch (err) {
    console.warn('CIPP tenant lookup failed', err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireFronteggSession();

    const companyIdentifier = req.nextUrl.searchParams.get('companyIdentifier')?.trim();
    if (!companyIdentifier) {
      return NextResponse.json(
        { error: 'Missing companyIdentifier' },
        { status: 400 }
      );
    }

    const { baseUrl, headers } = await cwHeadersAndBaseForCurrentUser();

    const [contacts, websiteDomain] = await Promise.all([
      fetchAllContacts(baseUrl, headers, companyIdentifier),
      fetchCompanyWebsite(baseUrl, headers, companyIdentifier),
    ]);

    const emails: string[] = [];
    contacts.forEach((contact) => {
      extractEmails(contact).forEach((email) => emails.push(email));
    });

    const { primaryDomain, candidates } = pickPrimaryDomain(
      emails,
      websiteDomain ? [websiteDomain] : []
    );

    let tenantId: string | null = null;
    if (primaryDomain) {
      tenantId = await resolveTenantId(primaryDomain);
    }

    return NextResponse.json({
      companyIdentifier,
      tenantId,
      primaryDomain,
      candidates,
      emailsAnalyzed: emails.length,
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? 'Failed to resolve CIPP tenant' },
      { status }
    );
  }
}

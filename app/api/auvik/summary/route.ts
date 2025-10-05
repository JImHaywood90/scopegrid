import { NextRequest, NextResponse } from 'next/server';
import { getAuvikCredsForCurrentUser } from '@/lib/integrations/getAuvikCreds';
import { requireFronteggSession } from '@/lib/auth/frontegg';

export const runtime = 'nodejs';

type AuvikListResponse<T = any> = {
  data?: Array<{
    id?: string;
    type?: string;
    attributes?: T;
  }>;
};

type DeviceAttributes = {
  name?: string;
  vendor?: string;
  model?: string;
  deviceType?: string;
  primaryIp?: string;
  lastSeen?: string;
  status?: string;
  onlineStatus?: string;
  siteId?: string;
  siteName?: string;
};

type AlertAttributes = {
  title?: string;
  severity?: string;
  acknowledged?: boolean;
  triggeredAt?: string;
  siteId?: string;
  siteName?: string;
};

type SiteAttributes = {
  name?: string;
};

function normalize(value?: string | null) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchAuvik<T>(baseUrl: string, path: string, authHeader: string, searchParams?: Record<string, string | number | undefined>) {
  const url = new URL(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    url.searchParams.set(key, String(value));
  });

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: authHeader,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw Object.assign(new Error(text || `Auvik request failed (${res.status})`), {
      status: res.status,
    });
  }

  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw Object.assign(new Error('Failed to parse Auvik response JSON'), {
      status: res.status,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireFronteggSession();

    const companyIdentifier = req.nextUrl.searchParams.get('companyIdentifier')?.trim() || '';
    const companyName = req.nextUrl.searchParams.get('companyName')?.trim() || '';

    const { baseUrl, username, apiKey } = await getAuvikCredsForCurrentUser();
    const authHeader = `Basic ${Buffer.from(`${username}:${apiKey}`).toString('base64')}`;

    const networksResp = await fetchAuvik<AuvikListResponse<SiteAttributes>>(
      `${baseUrl}/v1`,
      'inventory/network/info',
      authHeader,
      { 'page[first]': 200 }
    );

    const normalizedCandidates = (networksResp?.data ?? []).map((site) => {
      const attrs = site?.attributes ?? ({} as SiteAttributes);
      const name = (attrs as any)?.networkName ?? attrs?.name ?? null;
      return {
        id: site?.id ?? null,
        name,
        normalized: normalize(name),
      };
    });

    const targets = [normalize(companyName), normalize(companyIdentifier)].filter(Boolean);
    let matchedSite: { id: string | null; name: string | null } | null = null;

    for (const target of targets) {
      if (!target) continue;
      matchedSite =
        normalizedCandidates.find((site) => site.normalized === target) ||
        normalizedCandidates.find((site) => target && site.normalized.includes(target)) ||
        null;
      if (matchedSite) break;
    }

    if (!matchedSite && normalizedCandidates.length === 1) {
      matchedSite = normalizedCandidates[0];
    }

    const siteId = matchedSite?.id ?? normalizedCandidates[0]?.id ?? null;

    const deviceParams: Record<string, string | number | undefined> = {
      'page[first]': 200,
    };
    if (siteId) deviceParams['filter[networks]'] = siteId;

    const devicesResp = await fetchAuvik<AuvikListResponse<DeviceAttributes>>(
      `${baseUrl}/v1`,
      'inventory/device/info',
      authHeader,
      deviceParams
    ).catch(() => null);

    const alertParams: Record<string, string | number | undefined> = {
      'page[first]': 100,
      'filter[status]': 'triggered',
    };
    if (siteId) alertParams['filter[entityId]'] = siteId;

    const alertsResp = await fetchAuvik<AuvikListResponse<AlertAttributes>>(
      `${baseUrl}/v1`,
      'alert/history/info',
      authHeader,
      alertParams
    ).catch(() => null);

    const devices = (devicesResp?.data ?? []).map((row) => {
      const attrs = row?.attributes ?? {};
      return {
        id: row?.id ?? null,
        name: attrs?.name ?? 'Unknown device',
        vendor: attrs?.vendor ?? null,
        model: attrs?.model ?? null,
        type: attrs?.deviceType ?? null,
        ip: attrs?.primaryIp ?? null,
        status: (attrs?.status ?? attrs?.onlineStatus ?? 'unknown').toString().toLowerCase(),
        lastSeen: attrs?.lastSeen ?? null,
        siteId: attrs?.siteId ?? matchedSite?.id ?? null,
        siteName: matchedSite?.name ?? null,
      };
    });

    const statusCounts = devices.reduce(
      (acc, device) => {
        const status = device.status || 'unknown';
        if (status.includes('online')) acc.online += 1;
        else if (status.includes('down') || status.includes('offline')) acc.offline += 1;
        else if (status.includes('warning') || status.includes('alert')) acc.warning += 1;
        else acc.unknown += 1;
        return acc;
      },
      { online: 0, offline: 0, warning: 0, unknown: 0 }
    );

    const alerts = (alertsResp?.data ?? []).map((row) => {
      const attrs = row?.attributes ?? {};
      const severity = (attrs?.severity ?? 'info').toString().toLowerCase();
      return {
        id: row?.id ?? null,
        title: attrs?.title ?? 'Alert',
        severity,
        acknowledged: attrs?.acknowledged ?? false,
        triggeredAt: attrs?.triggeredAt ?? null,
        siteId: attrs?.siteId ?? matchedSite?.id ?? null,
        siteName: matchedSite?.name ?? null,
      };
    });

    const severityCounts = alerts.reduce(
      (acc, alert) => {
        const sev = alert.severity;
        if (sev.includes('critical')) acc.critical += 1;
        else if (sev.includes('major') || sev.includes('warning')) acc.warning += 1;
        else acc.info += 1;
        return acc;
      },
      { critical: 0, warning: 0, info: 0 }
    );

    return NextResponse.json({
      companyIdentifier,
      companyName,
      site: matchedSite ?? null,
      devices: {
        total: devices.length,
        statusCounts,
        items: devices,
      },
      alerts: {
        total: alerts.length,
        severityCounts,
        items: alerts,
      },
      sites: normalizedCandidates.map((site) => ({ id: site.id, name: site.name })),
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? 'Failed to load Auvik summary' },
      { status }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAppSession } from "@frontegg/nextjs/app";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/drizzle";
import { merakiOrgMappings } from "@/lib/db/schema.v2";
import { getMerakiCredsForCurrentUser } from "@/lib/integrations/getMerakiCreds";

export const runtime = "nodejs";

type MerakiDeviceStatus = {
  status?: string;
};

type LicenseOverview = {
  status?: string;
  expirationDate?: string;
};

async function requireFeTenantId(): Promise<string> {
  const session = await getAppSession();
  const feTenantId =
    session?.user?.tenantId ?? (session?.user as any)?.tenantIds?.[0];
  if (!feTenantId) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return feTenantId;
}

export async function GET(req: NextRequest) {
  try {
    const companyIdentifier =
      req.nextUrl.searchParams.get("companyIdentifier")?.trim() || "";
    if (!companyIdentifier) {
      return NextResponse.json(
        { error: "Missing companyIdentifier" },
        { status: 400 }
      );
    }

    const feTenantId = await requireFeTenantId();

    const rows = await db
      .select()
      .from(merakiOrgMappings)
      .where(
        and(
          eq(merakiOrgMappings.feTenantId, feTenantId),
          eq(merakiOrgMappings.companyIdentifier, companyIdentifier)
        )
      );

    if (rows.length === 0) {
      return NextResponse.json({
        companyIdentifier,
        items: [],
        totals: {
          organizations: 0,
          devices: 0,
          offlineDevices: 0,
          alertingDevices: 0,
          networks: 0,
        },
      });
    }

    const { apiKey, baseUrl } = await getMerakiCredsForCurrentUser();
    const root = baseUrl.replace(/\/+$/, "");

    const fetchMeraki = async <T>(
      path: string
    ): Promise<{ data: T | null; status: number }> => {
      const url = `${root}/${path.replace(/^\/+/, "")}`;
      try {
        const res = await fetch(url, {
          headers: {
            "X-Cisco-Meraki-API-Key": apiKey,
            Accept: "application/json",
          },
          cache: "no-store",
        });
        if (!res.ok) {
          return { data: null, status: res.status };
        }
        const text = await res.text();
        if (!text) return { data: null, status: res.status };
        try {
          return { data: JSON.parse(text) as T, status: res.status };
        } catch {
          return { data: null, status: res.status };
        }
      } catch {
        return { data: null, status: 0 };
      }
    };

    const items = await Promise.all(
      rows.map(async (row) => {
        const orgId = row.merakiOrgId;
        const orgName = row.merakiOrgName;
        const errors: string[] = [];

        const [statusesRes, networksRes, licensesRes] = await Promise.all([
          fetchMeraki<MerakiDeviceStatus[]>(
            `organizations/${orgId}/devices/statuses?perPage=1000`
          ),
          fetchMeraki<any[]>(`organizations/${orgId}/networks?perPage=1000`),
          fetchMeraki<LicenseOverview>(
            `organizations/${orgId}/licenses/overview`
          ),
        ]);

        const statuses = Array.isArray(statusesRes.data)
          ? statusesRes.data
          : [];
        if (statusesRes.status >= 400) {
          errors.push("Device status fetch failed");
        }

        const networks = Array.isArray(networksRes.data)
          ? networksRes.data
          : [];
        if (networksRes.status >= 400) {
          errors.push("Network fetch failed");
        }

        const overview = licensesRes.data ?? null;
        if (licensesRes.status >= 400) {
          errors.push("License overview fetch failed");
        }

        const deviceCounts = statuses.reduce(
          (acc, device) => {
            const status = (device?.status || "").toLowerCase();
            if (status === "online") acc.online += 1;
            else if (status === "offline") acc.offline += 1;
            else if (status === "alerting") acc.alerting += 1;
            else if (status === "dormant") acc.dormant += 1;
            else acc.other += 1;
            return acc;
          },
          { online: 0, offline: 0, alerting: 0, dormant: 0, other: 0 }
        );

        const totalDevices = statuses.length;
        const networkCount = networks.length;
        const licenseStatus = overview?.status ?? null;
        const licenseExpiration = overview?.expirationDate ?? null;
        const expirationMs = licenseExpiration
          ? Date.parse(licenseExpiration)
          : Number.NaN;
        const licenseExpiresInDays = Number.isFinite(expirationMs)
          ? Math.round((expirationMs - Date.now()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          merakiOrgId: orgId,
          merakiOrgName: orgName,
          companyIdentifier: row.companyIdentifier,
          companyName: row.companyName,
          networkCount,
          totalDevices,
          deviceCounts,
          licenseStatus,
          licenseExpiration,
          licenseExpiresInDays,
          devices: statuses, // raw device status array
          networks: networks, // raw networks array
          errors,
        };
      })
    );

    const totals = items.reduce(
      (acc, item) => {
        acc.organizations += 1;
        acc.devices += item.totalDevices;
        acc.offlineDevices += item.deviceCounts.offline;
        acc.alertingDevices += item.deviceCounts.alerting;
        acc.networks += item.networkCount;
        return acc;
      },
      {
        organizations: 0,
        devices: 0,
        offlineDevices: 0,
        alertingDevices: 0,
        networks: 0,
      }
    );

    return NextResponse.json({ companyIdentifier, items, totals });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? "Failed to load Meraki summary" },
      { status }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  getCippAccessTokenForCurrentUser,
  invalidateCippTokenForTenant,
} from "@/lib/integrations/getCippCreds";

export const runtime = "nodejs";

type UserCounts = {
  Users?: number;
  LicUsers?: number;
  LicencedUsers?: number;
  Guests?: number;
  [key: string]: unknown;
};

type SecureScoreItem = {
  currentScore?: number;
  maxScore?: number;
};

type GlobalAdmin = {
  displayName?: string;
  userPrincipalName?: string;
  accountEnabled?: boolean;
};

type Partner = {
  tenantId?: string;
  displayName?: string;
};

type SharepointQuota = {
  Percentage?: number;
  GeoUsedStorageMB?: number;
  TenantStorageMB?: number;
};

async function fetchJson<T>(url: string, options: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(
      new Error(text || `CIPP request failed (${res.status})`),
      {
        status: res.status,
      }
    );
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw Object.assign(new Error("Failed to parse CIPP response JSON"), {
      status: res.status,
    });
  }
}

function ensureNumber(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get("tenantId")?.trim();
    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    const execute = async (
      retry = true
    ): Promise<{
      userCounts: UserCounts | null;
      secureScoreResp: {
        value?: SecureScoreItem[];
        Results?: SecureScoreItem[];
      } | null;
      adminsResp: GlobalAdmin[] | null;
      partnersResp: Partner[] | null;
      sharepointResp: SharepointQuota | null;
    }> => {
      const { feTenantId, accessToken, apiBaseUrl } =
        await getCippAccessTokenForCurrentUser();

      const base = apiBaseUrl.replace(/\/+$/, "");

      const cippFetch = async <T>(
        path: string,
        params: Record<string, string | number | boolean | undefined> = {}
      ) => {
        const url = new URL(`${base}/api/${path.replace(/^\/+/, "")}`);
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          url.searchParams.append(key, String(value));
        });
        return fetchJson<T>(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        });
      };

      try {
        const [
          userCounts,
          secureScoreResp,
          adminsResp,
          partnersResp,
          sharepointResp,
        ] = await Promise.all([
          cippFetch<UserCounts>("ListuserCounts", {
            TenantFilter: tenantId,
          }).catch(() => null),
          cippFetch<{ value?: SecureScoreItem[]; Results?: SecureScoreItem[] }>(
            "ListGraphRequest",
            {
              TenantFilter: tenantId,
              Endpoint: "security/secureScores",
              $top: 7,
              noPagination: true,
              $count: true,
            }
          ).catch(() => null),
          cippFetch<GlobalAdmin[]>("ListGraphRequest", {
            TenantFilter: tenantId,
            Endpoint:
              "/directoryRoles(roleTemplateId='62e90394-69f5-4237-9190-012177145e10')/members",
            $select: "displayName,userPrincipalName,accountEnabled",
          }).catch(() => null),
          cippFetch<Partner[]>("ListGraphRequest", {
            TenantFilter: tenantId,
            Endpoint: "policies/crossTenantAccessPolicy/partners",
            ReverseTenantLookup: true,
          }).catch(() => null),
          cippFetch<SharepointQuota>("ListSharepointQuota", {
            TenantFilter: tenantId,
          }).catch(() => null),
        ]);

        return {
          userCounts,
          secureScoreResp,
          adminsResp,
          partnersResp,
          sharepointResp,
        };
      } catch (err: any) {
        if (err?.status === 401 && retry) {
          invalidateCippTokenForTenant(feTenantId);
          return execute(false);
        }
        throw err;
      }
    };

    const {
      userCounts,
      secureScoreResp,
      adminsResp,
      partnersResp,
      sharepointResp,
    } = await execute();

    const totalUsers = ensureNumber(
      userCounts?.Users ??
        (userCounts as any)?.users ??
        (userCounts as any)?.TotalUsers
    );
    const licensedUsers = ensureNumber(
      userCounts?.LicUsers ??
        (userCounts as any)?.LicencedUsers ??
        (userCounts as any)?.licensedUsers
    );
    const guestUsers = ensureNumber(
      userCounts?.Guests ?? (userCounts as any)?.guestUsers
    );

    const secureList = Array.isArray(secureScoreResp?.value)
      ? secureScoreResp?.value
      : Array.isArray(secureScoreResp?.Results)
      ? secureScoreResp?.Results
      : [];
    const secureTop = secureList?.[0] ?? {};
    const currentScore = ensureNumber(secureTop?.currentScore);
    const maxScore =
      ensureNumber(secureTop?.maxScore) ?? (currentScore != null ? 100 : null);
    const securePercent =
      currentScore != null && maxScore
        ? Math.round((currentScore / Math.max(1, maxScore)) * 100)
        : null;

    const sharePercent = ensureNumber(sharepointResp?.Percentage);
    const shareUsedMB = ensureNumber(sharepointResp?.GeoUsedStorageMB);
    const shareTotalMB = ensureNumber(sharepointResp?.TenantStorageMB);

    const globalAdmins = Array.isArray(adminsResp)
      ? adminsResp.map((admin) => ({
          displayName: admin?.displayName ?? null,
          userPrincipalName: admin?.userPrincipalName ?? null,
          accountEnabled:
            typeof admin?.accountEnabled === "boolean"
              ? admin.accountEnabled
              : null,
        }))
      : [];

    const partners = Array.isArray(partnersResp)
      ? partnersResp.map((partner) => ({
          tenantId: partner?.tenantId ?? null,
          displayName: partner?.displayName ?? null,
        }))
      : [];

    return NextResponse.json({
      tenantId,
      users: {
        total: totalUsers,
        licensed: licensedUsers,
        guests: guestUsers,
        unlicensed:
          totalUsers != null && licensedUsers != null
            ? Math.max(totalUsers - licensedUsers, 0)
            : null,
      },
      secureScore: {
        current: currentScore,
        max: maxScore,
        percent: securePercent,
      },
      sharepoint: {
        percent: sharePercent,
        usedGB:
          shareUsedMB != null
            ? Math.round((shareUsedMB / 1024) * 10) / 10
            : null,
        totalGB:
          shareTotalMB != null
            ? Math.round((shareTotalMB / 1024) * 10) / 10
            : null,
      },
      globalAdmins,
      partners,
    });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json(
      { error: err?.message ?? "Failed to load CIPP summary" },
      { status }
    );
  }
}

"use client";

import * as React from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CompanySearchCombobox, CompanyOption } from "./CompanySearchCombobox";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const err: any = new Error(parsed?.error || text || "Request failed");
    err.status = res.status;
    throw err;
  }
  return parsed ?? null;
};

type MerakiOrganization = {
  id?: string | number;
  name?: string;
  url?: string | null;
};

type MerakiMapping = {
  merakiOrgId: string;
  merakiOrgName: string;
  companyIdentifier: string;
  companyName: string | null;
};

type MappingResponse = {
  items: MerakiMapping[];
};

export function MerakiOrgMatcher() {
  const { data: orgData, error: orgError, isLoading: orgLoading } = useSWR<MerakiOrganization[] | null>(
    "/api/meraki/organizations?perPage=1000",
    fetcher
  );
  const {
    data: mappingData,
    error: mappingError,
    isLoading: mappingLoading,
    mutate: mutateMappings,
  } = useSWR<MappingResponse>("/api/meraki/mappings", fetcher);

  const [pendingOrg, setPendingOrg] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const items = React.useMemo(() => {
    const orgs = Array.isArray(orgData) ? orgData : [];
    const mappings = mappingData?.items ?? [];
    const mapByOrg = new Map<string, MerakiMapping>();
    mappings.forEach((m) => mapByOrg.set(String(m.merakiOrgId), m));
    return orgs
      .map((org) => {
        const id = String(org?.id ?? "").trim();
        if (!id) return null;
        const mapping = mapByOrg.get(id) ?? null;
        return {
          id,
          name: String(org?.name ?? "Unnamed org"),
          url: org?.url?.toString?.() ?? null,
          mapping,
        };
      })
      .filter((v): v is { id: string; name: string; url: string | null; mapping: MerakiMapping | null } => v !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [orgData, mappingData]);

  async function assign(org: { id: string; name: string }, company: CompanyOption) {
    setPendingOrg(org.id);
    setActionError(null);
    try {
      const res = await fetch("/api/meraki/mappings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          merakiOrgId: org.id,
          merakiOrgName: org.name,
          companyIdentifier: company.identifier,
          companyName: company.name,
        }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await mutateMappings();
    } catch (err: any) {
      setActionError(err?.message || "Failed to save mapping");
    } finally {
      setPendingOrg(null);
    }
  }

  async function clear(org: { id: string }) {
    setPendingOrg(org.id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/meraki/mappings?orgId=${encodeURIComponent(org.id)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await mutateMappings();
    } catch (err: any) {
      setActionError(err?.message || "Failed to clear mapping");
    } finally {
      setPendingOrg(null);
    }
  }

  const loading = orgLoading || mappingLoading;

  return (
    <Card className="mt-6 rounded-2xl border-slate-200/70 bg-white/85 dark:border-slate-700/60 dark:bg-slate-900/65 backdrop-blur">
      <CardHeader>
        <CardTitle>Map Meraki organizations</CardTitle>
        <CardDescription>
          Link each Meraki organization to the matching PSA company so dashboards can
          display network health per customer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={`meraki-org-skel-${idx}`} className="h-16 w-full" />
            ))}
          </div>
        ) : orgError ? (
          <div className="text-sm text-rose-600">
            {orgError?.status === 400
              ? "Add your Meraki credentials above to load organizations."
              : orgError.message || "Unable to load Meraki organizations."}
          </div>
        ) : !items.length ? (
          <div className="text-sm text-muted-foreground">
            No Meraki organizations were returned for this account.
          </div>
        ) : (
          <div className="space-y-3">
            {actionError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-2 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300">
                {actionError}
              </div>
            ) : null}

            {items.map((item) => {
              const mapping = item.mapping;
              const selected: CompanyOption | null = mapping
                ? {
                    identifier: mapping.companyIdentifier,
                    name: mapping.companyName ?? mapping.companyIdentifier,
                  }
                : null;
              const busy = pendingOrg === item.id;
              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200/70 bg-white/70 p-4 transition-colors dark:border-slate-700/60 dark:bg-slate-950/40 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm md:text-base">{item.name}</span>
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mapping ? (
                        <span>
                          Linked to <strong>{mapping.companyName ?? mapping.companyIdentifier}</strong>
                        </span>
                      ) : (
                        <span>Not linked to a PSA company yet.</span>
                      )}
                    </div>
                    {mapping ? (
                      <Badge variant="outline" className="w-fit">
                        {mapping.companyIdentifier}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <CompanySearchCombobox
                      value={selected}
                      onSelect={(company) => assign(item, company)}
                      disabled={busy}
                    />
                    {mapping ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => clear(item)}
                        disabled={busy}
                      >
                        Clear
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {mappingError && !loading ? (
          <div className="text-xs text-amber-600">
            {mappingError.message || "Failed to load existing mappings."}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

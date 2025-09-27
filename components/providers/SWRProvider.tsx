// components/providers/SWRProvider.tsx
"use client";

import { SWRConfig } from "swr";
import { useAuth } from "@frontegg/nextjs";
import { useCallback, PropsWithChildren } from "react";

export default function SWRProvider({ children }: PropsWithChildren) {
  const { user } = useAuth(); // user?.accessToken if you need to call external APIs

  const fetcher = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    const res = await fetch(input, {
      // important for same-origin route handlers guarded by Frontegg cookies
      credentials: "include",
      cache: "no-store",
      headers: {
        ...(init?.headers ?? {}),
        // attach FE access token only if you need to call *external* APIs from the browser
        ...(user?.accessToken ? { Authorization: `Bearer ${user.accessToken}` } : {}),
        "Content-Type": "application/json",
      },
      ...init,
    });

    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }

    if (!res.ok) {
      const err: any = new Error(json?.error || text || "Request failed");
      err.status = res.status;
      throw err;
    }
    return json ?? {};
  }, [user?.accessToken]);

  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: (err) => (err?.status ?? 500) >= 500,
        errorRetryCount: 2,
        dedupingInterval: 1000,
      }}
    >
      {children}
    </SWRConfig>
  );
}

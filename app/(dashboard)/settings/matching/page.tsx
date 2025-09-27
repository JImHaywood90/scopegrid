'use client';

import * as React from 'react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CompanyPicker from '@/components/ConnectWise/company-picker';
import { Loader2 } from 'lucide-react';
import UnmatchedPanel from './UnmatchedPanel';
import MatchedProductsList from './MatchedProductsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ScanResp } from './types';

const fetcher = async (u: string) => {
  const r = await fetch(u, { cache: 'no-store' });
  const t = await r.text();
  try { return JSON.parse(t) as ScanResp; } catch { throw new Error(t || 'Bad JSON'); }
};

export default function MatchingPage() {
  const sp = useSearchParams();
  const qsCompany = sp?.get('companyIdentifier') || sp?.get('CompanyIdentifier') || '';
  const { data, error, isLoading, mutate } = useSWR<ScanResp>(
    '/api/matching/scan' + (qsCompany ? `?companyIdentifier=${encodeURIComponent(qsCompany)}` : ''),
    fetcher
  );

  return (
    <section className="flex-1 p-4 lg:p-8 min-h-[calc(100vh- var(--header-height,64px))]">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg lg:text-2xl font-medium">Product Matching</h1>
        <div className="flex gap-2 items-center">
          <CompanyPicker onChanged={() => mutate()} className="w-[340px]" />
          <Button variant="outline" onClick={() => mutate()}>Rescan</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
        </div>
      ) : error ? (
        // @ts-ignore (status attached in fetcher)
        error.status === 400 ? (
          <div className="text-sm text-muted-foreground">Pick a company to scan.</div>
        ) : (
          <div className="text-red-600">Failed to scan.</div>
        )
      ) : !data ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-170px)]">
          <UnmatchedPanel data={data} mutate={mutate} />
          <Card className="flex flex-col min-h-0">
            <CardHeader className="shrink-0">
              <CardTitle>Matched products ({data.counts.matched})</CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 overflow-y-auto pr-1">
              <MatchedProductsList data={data} onChange={mutate} />
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

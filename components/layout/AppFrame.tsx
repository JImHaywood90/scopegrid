'use client';

import { ReactNode, useEffect } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter } from 'next/navigation';
import type { TeamDataWithMembers } from '@/lib/db/schema';

import AppHeader from '@/components/layout/AppHeader';
import DashboardCenter from '@/components/layout/DashboardCenter';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function AppFrame({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const teamId = team?.id;
  const { data: tenant, isLoading } = useSWR(
    teamId ? `/api/tenant-settings?teamId=${teamId}` : null,
    fetcher
  );

  useEffect(() => {
    if (tenant && !tenant.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [tenant, router]);

  const checking = teamId && (isLoading || (tenant && !tenant.onboardingCompleted));

  const useHeader =
    pathname?.startsWith('/dashboard') ||
    pathname?.startsWith('/settings') ||
    pathname === '/demo';

  const center = pathname?.startsWith('/dashboard') ? <DashboardCenter /> : undefined;

  return (
    <section className="flex flex-col min-h-screen">
      {useHeader ? <AppHeader center={center} /> : <AppHeader />}

      {checking ? (
        <div className="flex-1 flex items-center justify-center p-10 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        children
      )}
    </section>
  );
}

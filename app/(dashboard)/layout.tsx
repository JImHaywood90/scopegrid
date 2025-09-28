// app/(dashboard)/layout.tsx
'use client';

import Link from 'next/link';
import { Suspense, useEffect } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@frontegg/nextjs';

import ThemedImage from '@/components/media/ThemedImage';
import ThemeToggle from '@/components/theme/ThemeToggle';
import UserMenu from '@/components/layout/UserMenu';
import CompanyPicker from '@/components/ConnectWise/company-picker';
import { Input } from '@/components/ui/input';
import SettingsShell from '@/components/layout/SettingsShell';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

function Header({ showCenter }: { showCenter: boolean }) {
  const router = useRouter();
  const sp = useSearchParams();
  const qParam = sp?.get('q') ?? '';

  const setQs = (next: Record<string, string | null>) => {
    const params = new URLSearchParams(sp?.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/dashboard?${params.toString()}`);
  };

  return (
    <header
      style={{ zIndex: '1000' }}
      className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-800/70 dark:supports-[backdrop-filter]:bg-slate-800/55 border-slate-200/70 dark:border-slate-700/60"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 py-2 w-full">
        <div className="justify-self-start min-w-0">
          <Link href="/" aria-label="ScopeGrid home" className="flex items-center gap-2">
            <ThemedImage
              light="/ScopeGridLogoLight.png"
              dark="/ScopeGridLogo.png"
              alt="ScopeGrid"
              width={150}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="justify-self-center min-w-0">
          {showCenter ? (
            <div className="flex items-center gap-2 max-w-[92vw] sm:max-w-[80vw] md:max-w-[60vw] overflow-x-auto no-scrollbar">
              <CompanyPicker className="w-[280px] shrink-0" onChanged={() => router.refresh()} />
              <Input
                placeholder="Search products…"
                defaultValue={qParam}
                className="w-40 sm:w-56 md:w-64 shrink-0"
                onChange={(e) => setQs({ q: e.currentTarget.value })}
              />
            </div>
          ) : null}
        </div>

        <div className="justify-self-end min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 flex items-center justify-center">
              <ThemeToggle />
            </div>
            <Suspense fallback={<div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />}>
              <UserMenu avatarClassName="h-9 w-9" />
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const isDashboard = pathname?.startsWith('/dashboard') ?? false;
  const isSettings  = pathname?.startsWith('/settings') ?? false;
  const isProtected = isDashboard || isSettings;

  // 1) Bootstrap tenant/user rows once after auth
  useEffect(() => {
    if (!isAuthenticated) return;
    // Fire and forget; backend is idempotent
    fetch('/api/bootstrap', { method: 'POST' }).catch(() => {});
  }, [isAuthenticated]);

  // 2) Pull tenant settings only on protected pages
  const { data: tenantSettings, isLoading } = useSWR(
    isAuthenticated && isProtected ? '/api/tenant-settings' : null,
    fetcher
  );

  // 3) Redirect to onboarding if not completed
  useEffect(() => {
    if (!isAuthenticated || !isProtected) return;
    if (tenantSettings && !tenantSettings.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [tenantSettings, isAuthenticated, isProtected, router]);

  const checking = isProtected && isAuthenticated && (isLoading || (tenantSettings && !tenantSettings.onboardingCompleted));

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
    <section className="flex flex-col min-h-screen">
      <Header showCenter={isDashboard} />

      {checking ? (
        <div className="flex-1 flex items-center justify-center p-10 text-sm text-gray-500">Loading…</div>
      ) : isSettings ? (
        <SettingsShell>{children}</SettingsShell>
      ) : (
        children
      )}
    </section>
    </Suspense>
  );
}

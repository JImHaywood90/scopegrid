'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useEffect, useState } from 'react';
import useSWR from 'swr';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import type { User, TeamDataWithMembers } from '@/lib/db/schema';
import CompanyPicker from '@/components/ConnectWise/company-picker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="#how-it-works"
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          How it works
        </Link>
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>
            {user.email
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/settings" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Standard header (used everywhere except /dashboard) */
function StandardHeader() {
  return (
    <header className="border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="ScopeGrid home">
          <Image
            src="/ScopeGridLogoLight.png"
            alt="ScopeGrid"
            width={160}
            height={40}
            className="h-12 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

/** Special dashboard header with company picker + filters */
function DashboardHeader() {
  const router = useRouter();
  const sp = useSearchParams();

  // controlled inputs from URL
  const qParam = sp.get('q') ?? '';
  const catParam = sp.get('cat') ?? '';
  const CAT_ALL = '__all';

  function setQs(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/dashboard?${params.toString()}`);
  }

  return (
    <header className="border-b border-gray-200">
      {/* top row: logo + user */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2" aria-label="ScopeGrid home">
          <Image src="/ScopeGridLogoLight.png" alt="ScopeGrid" width={140} height={36} className="h-10 w-auto" />
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>

      {/* sub-row: company picker + filters */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <CompanyPicker
              onChanged={() => {
                // cookie set internally by picker; just refresh to re-fetch
                router.refresh();
              }}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Input
              placeholder="Search products…"
              defaultValue={qParam}
              className="w-full md:w-64"
              onChange={(e) => setQs({ q: e.currentTarget.value })}
            />
            <Select
              value={(catParam && catParam.length > 0) ? catParam : CAT_ALL}
              onValueChange={(v) => setQs({ cat: v === CAT_ALL ? '' : v })}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={CAT_ALL}>All categories</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Backup">Backup</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
                <SelectItem value="Network">Network</SelectItem>
                <SelectItem value="Productivity">Productivity</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setQs({ q: '', cat: '' })}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  // onboarding check
  const { data: team } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const teamId = team?.id;
  const { data: tenant, isLoading } = useSWR(teamId ? `/api/tenant-settings?teamId=${teamId}` : null, fetcher);

  useEffect(() => {
    if (tenant && !tenant.onboardingCompleted) {
      router.replace('/onboarding');
    }
  }, [tenant, router]);

  const checking = teamId && (isLoading || (tenant && !tenant.onboardingCompleted));

  // choose header variant
  const isDashboard = pathname === '/dashboard';

  return (
    <section className="flex flex-col min-h-screen">
      {isDashboard ? <DashboardHeader /> : <StandardHeader />}

      {checking ? (
        <div className="flex-1 flex items-center justify-center p-10 text-sm text-gray-500">
          Loading…
        </div>
      ) : (
        children
      )}
    </section>
  );
}

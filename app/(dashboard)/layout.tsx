'use client';

import Link from 'next/link';
import Image from 'next/image';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fetcher = (url: string) => fetch(url).then((res) => res.json());


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
        {/* <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div> */}
      </div>
    </header>
  );
}


export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  <meta name="apple-mobile-web-app-title" content="ScopeGrid" />
  return (
    <section className="flex flex-col min-h-screen">
    <StandardHeader />
        {children}
    </section>
  );
}

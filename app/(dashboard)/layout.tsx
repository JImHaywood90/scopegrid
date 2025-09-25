'use client';

import Link from 'next/link';
import Image from 'next/image';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const fetcher = (url: string) => fetch(url).then((res) => res.json());


export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  <meta name="apple-mobile-web-app-title" content="ScopeGrid" />
  return (
    <section className="flex flex-col min-h-screen">
        {children}
    </section>
  );
}

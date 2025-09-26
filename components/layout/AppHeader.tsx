'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import ThemedImage from '@/components/media/ThemedImage';
import ThemeToggle from '@/components/theme/ThemeToggle';
import UserMenu from '@/components/layout/UserMenu';

export default function AppHeader({ center }: { center?: React.ReactNode }) {
  return (
    <header
      className="sticky top-0 z-40 border-b
      bg-gradient-to-b from-slate-50/90 to-white/70
      dark:from-slate-900/85 dark:to-slate-900/60
      backdrop-blur supports-[backdrop-filter]:bg-white/60
      border-slate-200/70 dark:border-slate-700/60"
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-4 py-2 w-full">
        {/* Left: Logo */}
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

        {/* Center: optional controls */}
        <div className="justify-self-center min-w-0">
          {center ? (
            <div className="flex items-center gap-2 max-w-[92vw] sm:max-w-[80vw] md:max-w-[60vw] overflow-x-auto no-scrollbar">
              {center}
            </div>
          ) : null}
        </div>

        {/* Right: Theme + User (same sizing for perfect alignment) */}
        <div className="justify-self-end min-w-0">
          <div className="flex items-center gap-2">
            <ThemeToggle className="h-9 w-9 rounded-full" />
            <Suspense fallback={<div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />}>
              <UserMenu avatarClassName="h-9 w-9" />
            </Suspense>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </header>
  );
}

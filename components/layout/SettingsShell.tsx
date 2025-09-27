'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Settings, Shield, Activity, Menu } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  img?: string; // optional logo path
};

/** Sticky left sidebar that hugs the viewport edge on all screen sizes. */
export default function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Tailor the list as you like
  const navItems: NavItem[] = [
    { href: '/settings', icon: Users, label: 'Team' },
    { href: '/settings/matching', icon: Shield, label: 'Custom Matching' },
    { href: '/settings/integrations', icon: Settings, label: 'Integrations' },
    { href: '/settings/connectwise', img: '/connectwise.png', label: 'ConnectWise' },
  ];

  // If you change header height, update this value (dashboard header is ~56px tall)
  const HEADER_H = 56;

  return (
    <div className="flex w-full min-h-[calc(100dvh-var(--header-h,56px))]" style={{ ['--header-h' as any]: `${HEADER_H}px` }}>
      {/* Sidebar */}
      <aside
        className={[
          'shrink-0 w-64',
          'bg-white/70 dark:bg-slate-900/60 backdrop-blur',
          'border-r border-slate-200/70 dark:border-slate-700/60',
          'sticky',
          // stick under the header
          `top-[${HEADER_H}px]`,
          'h-[calc(100dvh-var(--header-h))]',
          // mobile slide in/out
          'lg:translate-x-0 lg:static z-40',
          open ? 'translate-x-0 fixed left-0 right-auto' : '-translate-x-full fixed left-0 right-auto',
          'transition-transform duration-300 ease-in-out',
        ].join(' ')}
        aria-hidden={!open && typeof window !== 'undefined' && window.innerWidth < 1024}
      >
        {/* Mobile close / title row */}
        <div className="lg:hidden flex items-center justify-between px-3 py-3 border-b border-slate-200/60 dark:border-slate-800/60">
          <span className="text-sm font-medium">Settings</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close sidebar">
            <Menu className="h-5 w-5 rotate-90" />
          </Button>
        </div>

        <nav className="h-[calc(100%-48px)] lg:h-full overflow-y-auto p-3">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className="block" onClick={() => setOpen(false)}>
                <Button
                  variant="ghost"
                  className={[
                    'w-full justify-start shadow-none my-0.5',
                    'hover:bg-slate-100 dark:hover:bg-slate-800/50',
                    active
                      ? 'bg-slate-100 dark:bg-slate-800/60 text-foreground'
                      : 'text-muted-foreground',
                  ].join(' ')}
                >
                  {item.img ? (
                    <Image src={item.img} alt={item.label} width={16} height={16} className="h-4 w-4 rounded-sm" />
                  ) : item.icon ? (
                    <item.icon className="h-4 w-4" />
                  ) : null}
                  <span className="ml-2">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Mobile “open sidebar” button (floats over content) */}
        <div className="lg:hidden sticky top-[var(--header-h)] z-30 px-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <main className="px-4 lg:px-8 py-4">
          {/* cap content width but keep sidebar hugging left */}
          <div className="max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

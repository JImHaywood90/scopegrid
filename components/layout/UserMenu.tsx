// components/layout/UserMenu.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { LayoutDashboard, Settings as SettingsIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import type { User } from '@/lib/db/schema';

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function UserMenu({ avatarClassName = 'h-9 w-9' }: { avatarClassName?: string }) {
  const [open, setOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  async function handleSignOut() {
    await signOut();
    window.location.href = '/';
  }

  if (!user) return null;

  // Nice initials: prefer name, otherwise email before @
  const label = (user.name && user.name.trim().length > 0) ? user.name : (user.email ?? '');
  const initials = label
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('');

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger aria-label="User menu">
        <Avatar className={`cursor-pointer ${avatarClassName}`}>
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback>{initials || 'U'}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="flex w-full items-center">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex w-full items-center">
            <SettingsIcon className="mr-2 h-4 w-4" />
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

// components/layout/UserMenu.tsx
'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@frontegg/nextjs';
import { LayoutDashboard, Settings as SettingsIcon, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function UserMenu({ avatarClassName = 'h-9 w-9' }: { avatarClassName?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const label = useMemo(() => {
    if (user?.name && user.name.trim()) return user.name;
    if (user?.email) return user.email;
    return 'User';
  }, [user]);

  const initials = useMemo(() => {
    return label
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'U';
  }, [label]);

  const onLogout = () => {
    // Hosted logout handled by Frontegg
    router.replace('/account/logout');
  };

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger aria-label="User menu">
        <Avatar className={`cursor-pointer ${avatarClassName}`}>
          {/* @ts-ignore Frontegg user may expose profilePictureUrl */}
          <AvatarImage alt={label} src={user?.profilePictureUrl || ''} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="flex flex-col gap-1 min-w-44">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          {label}
        </div>

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

        <DropdownMenuItem
          className="cursor-pointer"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

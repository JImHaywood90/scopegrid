// app/(dashboard)/settings/page.tsx
"use client";

import { Suspense } from "react";
import useSWR from "swr";
import { useAuth } from "@frontegg/nextjs";
import { AdminPortal } from "@frontegg/nextjs";
import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SettingsShell from "@/components/layout/SettingsShell";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

/* ---------- Subscription card (kept minimal) ---------- */
function SubscriptionSkeleton() {
  return (
    <Card
      className={cn(
        "mb-8 h-[140px] p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60",
        "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
      )}
    >
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  // If you have a new tenant-scoped billing summary endpoint, use it here.
  // For now we just show the portal button.
  return (
    <Card
      className={cn(
        "mb-8 p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60",
        "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
      )}
    >
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-medium">Manage your plan and payment method</p>
          <p className="text-sm text-muted-foreground">
            Opens the Stripe customer portal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Profile summary (from Frontegg session) ---------- */
function MyProfile() {
  const { user } = useAuth();
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={cn(
        "mb-8 p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60",
        "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
      )}
    >
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          {/* Frontegg may provide profilePictureUrl */}
          {/* @ts-ignore */}
          <AvatarImage
            src={user?.profilePictureUrl || ""}
            alt={user?.name || user?.email || "User"}
          />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="font-medium">{user?.name || user?.email}</div>
          {!!user?.email && (
            <div className="text-sm text-muted-foreground">{user.email}</div>
          )}
          {/* Some tenants/claims include tenant name/id */}
          {!!(user as any)?.tenantId && (
            <div className="text-xs text-muted-foreground">
              Tenant: {(user as any).tenantId}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---------- Team management via Frontegg Admin Portal ---------- */
function TeamManagement() {
  const openAdminPortal = () => AdminPortal.show();

  return (
    <Card
      className={cn(
        "mb-8 p-4 rounded-2xl border-slate-200/70 dark:border-slate-700/60",
        "bg-white/85 dark:bg-slate-900/65 backdrop-blur hover:shadow-md transition-all"
      )}
    >
      <CardHeader>
        <CardTitle>Team &amp; Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Manage users, invite teammates, assign roles, configure SSO and
          security policies in the Frontegg Admin Portal.
        </p>
        <Button
          onClick={openAdminPortal}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Open Admin Portal
        </Button>
      </CardContent>
    </Card>
  );
}

/* ---------- Optional: lightweight invite form that just emails a link ----------
   If you want to keep an email input here, you can either:
   1) Open Admin Portal and use its Invite flow (recommended), or
   2) Call your own server action that invokes Frontegg Management API (requires server-side call with CLIENT_SECRET).
   For now, we keep the portal button above and omit the custom invite flow to avoid secret exposure on the client.
-------------------------------------------------------------------------------*/

export default function SettingsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Integrations</h1>

      <Suspense fallback={<SubscriptionSkeleton />}>
        <ManageSubscription />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading profile...
          </div>
        }
      >
        <MyProfile />
      </Suspense>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading teams...
          </div>
        }
      >
        <TeamManagement />
      </Suspense>
    </section>
  );
}

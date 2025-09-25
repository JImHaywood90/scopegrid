"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Fake user menu for the demo – no API, no auth */
function DemoUserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Home</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Simple local-state “company picker” for demo */
function DemoCompanyPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const companies = useMemo(
    () => ["Acme Corp", "Globex", "Umbrella", "Initech", "Soylent"],
    []
  );
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a company" />
      </SelectTrigger>
      <SelectContent>
        {companies.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Dashboard-styled header, but entirely fake/local state */
export default function DemoHeader() {
  const router = useRouter();
  const sp = useSearchParams();

  // reflect search UI in URL like the real dashboard
  const qParam = sp.get("q") ?? "";
  const catParam = sp.get("cat") ?? "";
  const companyParam = sp.get("co") ?? "";
  const CAT_ALL = "__all";

  const [company, setCompany] = useState(companyParam || "Acme Corp");

  function setQs(next: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/demo?${params.toString()}`);
  }

  return (
    <header className="border-b border-gray-200">
      {/* top row: logo + user */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="ScopeGrid home"
        >
          <Image
            src="/ScopeGridLogoLight.png"
            alt="ScopeGrid"
            width={140}
            height={36}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center space-x-4">
          <DemoUserMenu />
        </div>
      </div>

      {/* sub-row: company picker + filters */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <DemoCompanyPicker
              value={company}
              onChange={(v) => {
                setCompany(v);
                setQs({ co: v });
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
              value={catParam && catParam.length > 0 ? catParam : CAT_ALL}
              onValueChange={(v) => setQs({ cat: v === CAT_ALL ? "" : v })}
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
            <Button variant="outline" onClick={() => setQs({ q: "", cat: "" })}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

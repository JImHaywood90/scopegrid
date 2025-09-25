"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Building2, Check, ChevronsUpDown, Loader2 } from "lucide-react";

/* ======================= Fake data ======================= */

type FakeCompany = { id: number; name: string; identifier: string };

const FAKE_COMPANIES: FakeCompany[] = [
  { id: 1, name: "Acme Manufacturing", identifier: "ACME" },
  { id: 2, name: "Globex Retail", identifier: "GLOBEX" },
  { id: 3, name: "Umbrella Health", identifier: "UMBRELLA" },
  { id: 4, name: "Initech", identifier: "INITECH" },
  { id: 5, name: "Stark Industries", identifier: "STARK" },
  { id: 6, name: "Wayne Enterprises", identifier: "WAYNE" },
  { id: 7, name: "Hooli", identifier: "HOOLI" },
  { id: 8, name: "Vehement Capital", identifier: "VEHEMENT" },
];

type CatalogItem = {
  slug: string;
  name: string;
  vendor?: string | null;
  category?: string | null;
  logoLightPath: string; // from /public/logos
  matchTerms?: string[];
};

const PRODUCT_CATALOG: CatalogItem[] = [
  {
    slug: "microsoft-365",
    name: "Microsoft 365",
    vendor: "Microsoft",
    category: "Productivity",
    logoLightPath: "/logos/microsoft250.png",
    matchTerms: ["m365", "o365", "office", "microsoft"],
  },
  {
    slug: "sentinelone",
    name: "SentinelOne",
    vendor: "SentinelOne",
    category: "Security",
    logoLightPath: "/logos/sentinel250.png",
    matchTerms: ["s1", "sentinelone"],
  },
  {
    slug: "veeam",
    name: "Veeam",
    vendor: "Veeam",
    category: "Backup",
    logoLightPath: "/logos/Veeam250_light.png",
    matchTerms: ["veeam"],
  },
  {
    slug: "mimecast",
    name: "Mimecast",
    vendor: "Mimecast",
    category: "Email",
    logoLightPath: "/logos/mimecast250.png",
    matchTerms: ["mimecast"],
  },
  {
    slug: "meraki",
    name: "Cisco Meraki",
    vendor: "Cisco",
    category: "Network",
    logoLightPath: "/logos/meraki250.png",
    matchTerms: ["meraki"],
  },
  {
    slug: "datto",
    name: "Datto",
    vendor: "Datto",
    category: "Backup",
    logoLightPath: "/logos/datto250.png",
    matchTerms: ["datto"],
  },
  {
    slug: "acronis",
    name: "Acronis",
    vendor: "Acronis",
    category: "Backup",
    logoLightPath: "/logos/acronis250_light.png",
    matchTerms: ["acronis"],
  },
  {
    slug: "webroot",
    name: "Webroot",
    vendor: "Webroot",
    category: "Security",
    logoLightPath: "/logos/webroot250_light.png",
    matchTerms: ["webroot"],
  },
  {
    slug: "barracuda",
    name: "Barracuda",
    vendor: "Barracuda",
    category: "Security",
    logoLightPath: "/logos/barracuda250_light.png",
    matchTerms: ["barracuda"],
  },
  {
    slug: "exclaimer",
    name: "Exclaimer",
    vendor: "Exclaimer",
    category: "Email",
    logoLightPath: "/logos/exclaimer250_light.png",
    matchTerms: ["exclaimer"],
  },
  {
    slug: "knowbe4",
    name: "KnowBe4",
    vendor: "KnowBe4",
    category: "Awareness",
    logoLightPath: "/logos/knowbe4250.png",
    matchTerms: ["knowbe4"],
  },
  {
    slug: "smtp2go",
    name: "SMTP2GO",
    vendor: "SMTP2GO",
    category: "Email",
    logoLightPath: "/logos/smtp2go250_light.png",
    matchTerms: ["smtp2go"],
  },
  {
    slug: "sonicwall",
    name: "SonicWall",
    vendor: "SonicWall",
    category: "Network",
    logoLightPath: "/logos/sonicwall250.png",
    matchTerms: ["sonicwall"],
  },
  {
    slug: "cove",
    name: "Cove",
    vendor: "N-able",
    category: "Backup",
    logoLightPath: "/logos/cove250_light.png",
    matchTerms: ["cove"],
  },
  {
    slug: "skykick",
    name: "SkyKick",
    vendor: "SkyKick",
    category: "Backup",
    logoLightPath: "/logos/skykick250.png",
    matchTerms: ["skykick"],
  },
];

const ALL_CATEGORIES = Array.from(
  new Set(PRODUCT_CATALOG.map((p) => p.category).filter(Boolean))
) as string[];

/* ============== Tiny helpers (no external libs) ============== */

// deterministic hash → pseudo-random selection per company
function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}
function pickDeterministic<T>(arr: T[], seed: string, min = 6, max = 14) {
  const h = hashString(seed);
  const count = min + (h % Math.max(1, max - min + 1));
  const out: T[] = [];
  let idx = h % arr.length;
  for (let i = 0; i < count; i++) {
    out.push(arr[idx % arr.length]);
    idx = (idx + (7 + (h % 11))) % arr.length; // step
  }
  // de-dupe while preserving order
  const seen = new Set();
  return out.filter((x) => {
    const key = (x as any).slug ?? x;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/* =================== UI bits (shadcn) =================== */

function SkeletonCard() {
  return (
    <div className="border rounded-xl p-3">
      <div className="aspect-[5/4] rounded-md bg-gray-100" />
      <div className="mt-2 h-4 w-3/5 rounded bg-gray-100" />
      <div className="mt-1 h-3 w-2/5 rounded bg-gray-100" />
    </div>
  );
}

function ProductCard({
  name,
  vendor,
  category,
  logoLightPath,
}: {
  name: string;
  vendor?: string | null;
  category?: string | null;
  logoLightPath: string;
}) {
  return (
    <div className="group border rounded-xl hover:shadow-sm transition-shadow cursor-default">
      <div className="aspect-[5/4] flex items-center justify-center p-3">
        <Image
          src={logoLightPath}
          alt={name}
          width={180}
          height={100}
          className="max-h-16 w-auto object-contain"
        />
      </div>
      <div className="px-3 pb-3">
        <div className="text-sm font-medium leading-tight truncate">{name}</div>
        <div className="text-[11px] text-muted-foreground truncate">
          {vendor || category || "\u00A0"}
        </div>
      </div>
    </div>
  );
}

function CompanyPickerDemo({
  value,
  onChange,
  className,
}: {
  value: FakeCompany | null;
  onChange: (c: FakeCompany) => void;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return FAKE_COMPANIES;
    return FAKE_COMPANIES.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        c.identifier.toLowerCase().includes(s)
    );
  }, [q]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={`w-[320px] justify-between ${className ?? ""}`}
          aria-expanded={open}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 opacity-70" />
            {value ? `${value.name} (${value.identifier})` : "Pick a company…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search companies…"
            value={q}
            onValueChange={setQ}
          />
          <CommandList>
            <CommandEmpty>No companies found</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.identifier}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.identifier}
                    </div>
                  </div>
                  <Check
                    className={`h-4 w-4 ${
                      value?.identifier === c.identifier
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* =================== The demo dashboard page =================== */

export default function DemoDashboardPage() {
  // hydrate selection from localStorage so it “sticks” on refresh
  const [company, setCompany] = React.useState<FakeCompany | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState<string>("all");

  // init from localStorage
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("sg.demo.company");
      if (raw) {
        const parsed = JSON.parse(raw) as FakeCompany;
        setCompany(parsed);
      }
    } catch {}
  }, []);

  function changeCompany(c: FakeCompany) {
    setCompany(c);
    try {
      localStorage.setItem("sg.demo.company", JSON.stringify(c));
    } catch {}
    // simulate network
    setLoading(true);
    setItems([]);
    setTimeout(() => {
      const matched = pickDeterministic(PRODUCT_CATALOG, c.identifier);
      setItems(matched);
      setLoading(false);
    }, 700);
  }

  // initial populate (if we loaded from storage)
  React.useEffect(() => {
    if (!company) return;
    setLoading(true);
    setTimeout(() => {
      const matched = pickDeterministic(PRODUCT_CATALOG, company.identifier);
      setItems(matched);
      setLoading(false);
    }, 500);
  }, [company?.identifier]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const inCat = category === "all" || p.category === category;
      const hay = `${p.name} ${p.vendor ?? ""} ${
        p.category ?? ""
      }`.toLowerCase();
      const hits = !q || hay.includes(q);
      return inCat && hits;
    });
  }, [items, search, category]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      {/* Header row (picker + filters) */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <CompanyPickerDemo value={company} onChange={changeCompany} />
          <Button
            variant="outline"
            className="hidden md:inline-flex"
            onClick={() => company && changeCompany(company)}
            disabled={!company || loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[220px]"
          />
            <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
            </SelectContent>
            </Select>
        </div>
      </div>

      {/* Title / status */}
      <div className="mb-4">
        {!company ? (
          <p className="text-sm text-muted-foreground mt-1">
            Pick a company to simulate detection.
          </p>
        ) : loading ? (
          <p className="text-sm text-muted-foreground mt-1">
            Detecting products…
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} products detected
          </p>
        )}
      </div>

      {/* Grid */}
      {!company ? (
        <div className="text-sm text-muted-foreground">
          No company selected.
        </div>
      ) : loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No products match your filters.
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {filtered.map((p) => (
            <ProductCard
              key={p.slug}
              name={p.name}
              vendor={p.vendor}
              category={p.category}
              logoLightPath={p.logoLightPath}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import {
  ExternalLink,
  Building2,
  ChevronsUpDown,
  Check,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { faker } from "@faker-js/faker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandInput,
  CommandList,
} from "@/components/ui/command";

/* --------------------------------- types --------------------------------- */
type UnifiedCompany = { identifier: string; name: string; subtitle?: string };
type Product = {
  id: string;
  name: string;
  description: string;
  lightLogo: string;
  darkLogo: string;
  href?: string;
};
type Dataset = {
  products: Product[];
  kpis: {
    cipp: { users: number; mfa: number; risky: number };
    backup: { successPct: number; failures24h: number; jobs: number };
  };
};

/* ---------------------------- logo source pool --------------------------- */
/** Provide light/dark if you want to swap later; using one path for brevity */
const PRODUCT_LOGOS: {
  key: string;
  lightsrc: string;
  darksrc: string;
  name: string;
  desc: string;
}[] = [
  {
    key: "m365",
    darksrc: "/logos/microsoft250.png",
    lightsrc: "/logos/microsoft250.png",
    name: "Microsoft 365",
    desc: "Email, collaboration, identity.",
  },
  {
    key: "s1",
    darksrc: "/logos/sentinel250.png",
    lightsrc: "/logos/sentinel250.png",
    name: "SentinelOne",
    desc: "EDR protection for endpoints.",
  },
  {
    key: "mer",
    darksrc: "/logos/meraki250.png",
    lightsrc: "/logos/meraki250_light.png",
    name: "Cisco Meraki",
    desc: "Secure SD-WAN, Wi-Fi, switching.",
  },
  {
    key: "mime",
    darksrc: "/logos/mimecast250.png",
    lightsrc: "/logos/mimecast250_light.png",
    name: "Mimecast",
    desc: "Email security & archiving.",
  },
  {
    key: "vee",
    darksrc: "/logos/Veeam250.png",
    lightsrc: "/logos/Veeam250_light.png",
    name: "Veeam",
    desc: "Backup for VMs & M365.",
  },
  {
    key: "cw",
    darksrc: "/logos/automate250.png",
    lightsrc: "/logos/automate250_light.png",
    name: "ConnectWise RMM",
    desc: "Patching, automations, alerts.",
  },
  {
    key: "exc",
    darksrc: "/logos/exclaimer250.png",
    lightsrc: "/logos/exclaimer250_light.png",
    name: "Exclaimer",
    desc: "Managed email signatures.",
  },
  {
    key: "wbr",
    darksrc: "/logos/webroot250.png",
    lightsrc: "/logos/webroot250_light.png",
    name: "Webroot",
    desc: "Endpoint AV & DNS filtering.",
  },
  {
    key: "ftn",
    darksrc: "/logos/fortinet250.png",
    lightsrc: "/logos/fortinet250_light.png",
    name: "Fortinet",
    desc: "Edge security & NGFW.",
  },
  {
    key: "arc",
    darksrc: "/logos/arcserve250.png",
    lightsrc: "/logos/arcserve250_light.png",
    name: "Arcserve",
    desc: "Backup & recovery.",
  },
  {
    key: "knb",
    darksrc: "/logos/knowbe4250.png",
    lightsrc: "/logos/knowbe4250.png",
    name: "KnowBe4",
    desc: "Security awareness training.",
  },
  {
    key: "s2g",
    darksrc: "/logos/smtp2go250.png",
    lightsrc: "/logos/smtp2go250_light.png",
    name: "SMTP2GO",
    desc: "Transactional email relay.",
  },
  {
    key: "kpr",
    darksrc: "/logos/keeper250.png",
    lightsrc: "/logos/keeper250_light.png",
    name: "Keeper",
    desc: "Enterprise password vault.",
  },
  {
    key: "cve",
    darksrc: "/logos/cove250.png",
    lightsrc: "/logos/cove250_light.png",
    name: "Cove",
    desc: "Endpoint & server backups.",
  },
  {
    key: "sky",
    darksrc: "/logos/skykick250.png",
    lightsrc: "/logos/skykick250.png",
    name: "SkyKick",
    desc: "M365 backup & migration.",
  },
  {
    key: "qls",
    darksrc: "/logos/qualys250.png",
    lightsrc: "/logos/qualys250_light.png",
    name: "Qualys",
    desc: "Vulnerability scanning.",
  },
];

/* ------------------------------ faker helpers ---------------------------- */
function seedOnce(seed = 424242) {
  // Avoid re-seeding on HMR: only seed the first time
  if (!(globalThis as any).__SG_FAKE_SEEDED__) {
    faker.seed(seed);
    (globalThis as any).__SG_FAKE_SEEDED__ = true;
  }
}

function pick<T>(arr: T[], n: number) {
  return faker.helpers.arrayElements(arr, n);
}

/** Create a realistic company code like SOL001 / BEG001 / ABC123 */
function companyIdentifier(): string {
  const prefix = faker.string.alpha({ length: 3, casing: "upper" });
  const digits = faker.number
    .int({ min: 1, max: 999 })
    .toString()
    .padStart(3, "0");
  return `${prefix}${digits}`;
}

/** Generate one dataset (products + KPI stats) */
function generateDataset(): Dataset {
  const productCount = faker.number.int({ min: 6, max: 8 });
  const chosen = pick(PRODUCT_LOGOS, productCount);

  const products: Product[] = chosen.map((l) => ({
    id: l.key,
    name: l.name,
    description: l.desc,
    lightLogo: l.lightsrc,
    darkLogo: l.darksrc,
    href: "#",
  }));

  // KPI heuristics with sensible ranges
  const users = faker.number.int({ min: 25, max: 450 });
  const mfa = faker.number.int({ min: 70, max: 99 });
  const risky = faker.number.int({
    min: 0,
    max: Math.max(0, Math.round(users * 0.02)),
  });

  const jobs = faker.number.int({ min: 40, max: 240 });
  const successPct = faker.number.int({ min: 90, max: 99 });
  const failures24h = Math.max(
    0,
    Math.round((jobs * (100 - successPct)) / 100)
  );

  return {
    products,
    kpis: {
      cipp: { users, mfa, risky },
      backup: { successPct, failures24h, jobs },
    },
  };
}

/** Build a stable fake “tenant” with N companies, each with its own dataset */
function buildFakeTenant(nCompanies = 4) {
  const companies: UnifiedCompany[] = Array.from({ length: nCompanies }).map(
    () => ({
      identifier: companyIdentifier(),
      name: faker.company.name(),
      subtitle: `${faker.helpers.arrayElement([
        "MSSP",
        "MSP",
        "SME",
      ])} • ${faker.location.countryCode("alpha-2")}`,
    })
  );

  const datasets: Record<string, Dataset> = {};
  for (const c of companies) {
    datasets[c.identifier] = generateDataset();
  }
  return { companies, datasets };
}

/* ----------------------------- shared card UI ---------------------------- */
function CardShell({
  children,
  href,
  lightLogo,
  darkLogo,
}: {
  children: React.ReactNode;
  href?: string;
  lightLogo?: string;
  darkLogo?: string;
}) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-white/85 dark:bg-slate-900/65",
        "border-slate-200/70 dark:border-slate-700/60",
        "hover:shadow-md hover:border-slate-300/70 dark:hover:border-slate-600/70",
        "transition-all"
      )}
    >
      <div className="flex items-center justify-between px-3 pt-3">
        <div className="h-6 flex items-center">
          {/* Light-mode logo */}
          {lightLogo ? (
            <Image
              src={lightLogo}
              alt=""
              width={180}
              height={40}
              className="h-6 w-auto object-contain block dark:hidden opacity-90"
            />
          ) : null}

          {/* Dark-mode logo */}
          {darkLogo ? (
            <Image
              src={darkLogo}
              alt=""
              width={180}
              height={40}
              className="h-6 w-auto object-contain hidden dark:block opacity-90"
            />
          ) : null}
        </div>

        <a
          href={href || "#"}
          onClick={(e) => e.preventDefault()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full
                     bg-slate-100/90 dark:bg-slate-800/70 border
                     border-slate-200/70 dark:border-slate-700/60
                     hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Open"
        >
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      </div>
      <div className="px-3 pb-3 pt-2">{children}</div>
    </div>
  );
}

function ProductCard({ p }: { p: Product }) {
  return (
    <CardShell lightLogo={p.lightLogo} darkLogo={p.darkLogo} href={p.href}>
      <div className="text-sm font-medium leading-tight">{p.name}</div>
      <div className="text-xs text-muted-foreground leading-snug mt-0.5">
        {p.description}
      </div>
    </CardShell>
  );
}

function MetricCard({
  title,
  lightLogo,
  darkLogo,
  rightIcon,
  metrics,
}: {
  title: string;
  lightLogo?: string;
  darkLogo?: string;
  rightIcon: "backup" | "cipp";
  metrics: { label: string; value: string }[];
}) {
  return (
    <CardShell lightLogo={lightLogo} darkLogo={darkLogo} href="#">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{title}</div>
        {rightIcon === "backup" ? (
          <BarChart3 className="h-4 w-4 text-slate-400" />
        ) : (
          <ShieldCheck className="h-4 w-4 text-slate-400" />
        )}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-lg font-semibold">{m.value}</div>
            <div className="text-[11px] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

/* ------------------------------ company picker --------------------------- */
function CompanyPicker({
  value,
  onChange,
  options,
  className,
}: {
  value: UnifiedCompany | null;
  onChange: (c: UnifiedCompany) => void;
  options: UnifiedCompany[];
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.identifier.toLowerCase().includes(q)
    );
  }, [query, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-9 w-[300px] justify-between rounded-lg", className)}
        >
          <span className="inline-flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 opacity-70" />
            {value ? `${value.name} (${value.identifier})` : "Pick a company…"}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search companies…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No results</CommandEmpty>
            <CommandGroup>
              {filtered.map((c) => (
                <CommandItem
                  key={c.identifier}
                  value={c.identifier}
                  onSelect={() => {
                    onChange(c);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.identifier} {c.subtitle ? `• ${c.subtitle}` : ""}
                    </div>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value?.identifier === c.identifier
                        ? "opacity-100"
                        : "opacity-0"
                    )}
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

/* ----------------------------- main component ---------------------------- */
export default function MockDashboard() {
  // Seed faker once to keep data stable across hot reloads
  React.useMemo(() => seedOnce(20250928), []);

  // Build a fake tenant once
  const { companies, datasets } = React.useMemo(() => buildFakeTenant(4), []);
  const [company, setCompany] = React.useState<UnifiedCompany | null>(
    companies[0]
  );

  const dataset = React.useMemo<Dataset>(() => {
    const id = company?.identifier || companies[0].identifier;
    return datasets[id];
  }, [company, companies, datasets]);

  const tiles = React.useMemo(() => {
    const k = dataset.kpis;
    const kpiTiles = [
      <MetricCard
        key="backup"
        title="BackupRadar"
        lightLogo="/integrations/backupradar.png"
        darkLogo="/integrations/backupradar.png"
        rightIcon="backup"
        metrics={[
          { label: "Success", value: `${k.backup.successPct}%` },
          { label: "Fails 24h", value: `${k.backup.failures24h}` },
          { label: "Jobs", value: `${k.backup.jobs}` },
        ]}
      />,
      <MetricCard
        key="cipp"
        title="CIPP (M365)"
        lightLogo="/integrations/cipp.png"
        darkLogo="/integrations/cipp.png"
        rightIcon="cipp"
        metrics={[
          { label: "Users", value: `${k.cipp.users}` },
          { label: "MFA", value: `${k.cipp.mfa}%` },
          { label: "Risky", value: `${k.cipp.risky}` },
        ]}
      />,
    ];
    const productTiles = dataset.products.map((p) => (
      <ProductCard key={p.id} p={p} />
    ));
    return [...kpiTiles, ...productTiles];
  }, [dataset]);

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute -inset-8 rounded-[28px] bg-gradient-to-tr from-orange-300/20 via-orange-200/10 to-transparent blur-2xl" />
      <div
        className="relative rounded-2xl overflow-hidden
                   border border-slate-200/70 dark:border-slate-700/60
                   bg-white/85 dark:bg-slate-900/60 backdrop-blur"
      >
        {/* header bar */}
        <div
          className="flex items-center justify-between h-12 px-3 sm:px-4
                     border-b border-slate-200/70 dark:border-slate-700/60
                     bg-white/80 dark:bg-slate-800/70"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-red-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-green-400/80" />
            <span className="ml-3 hidden sm:inline">
              ScopeGrid — Client Products
            </span>
          </div>
          <CompanyPicker
            value={company}
            onChange={setCompany}
            options={companies}
          />
        </div>

        {/* uniform grid */}
        <div className="p-3 sm:p-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            {tiles.map((node, i) => (
              <React.Fragment key={i}>{node}</React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

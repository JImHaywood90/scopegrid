"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PanelsTopLeft,
  ScanSearch,
  ShieldCheck,
  PlugZap,
  ArrowRight,
  ExternalLink,
  ServerCog,
  GitMerge,
  Database,
  Building2,
  Globe2,
  LockKeyhole,
  Mail,
  Grid,
} from "lucide-react";
import PricingSectionClient from "@/components/pricing/PricingSection.client";
import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sheet,
} from "@/components/ui/sheet";
import MockDashboard from "@/components/homepage/MockDashboard";
import { cn } from "@/lib/utils";
import { IntegrationCard } from "@/components/integrations/IntegrationsCard";
import { INTEGRATIONS } from "@/components/integrations/registry";
import { BookerEmbed } from "@calcom/atoms";
import ScheduleDemoButton from "@/components/homepage/ScheduleDemoButton";

/* -------------------------------- utils -------------------------------- */
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useInView<T extends Element>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!ref.current || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { threshold: 0 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

/* -------------------------- left aligned wordmark -------------------------- */
// function LeftLogo() {
//   return (
//     <div className="relative pt-1">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex items-left justify-left">
//           <img
//             src="/ScopeGridLogoLight.png"
//             alt="ScopeGrid"
//             width={560}
//             height={140}
//             className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-sm"
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

function PricingTeaser() {
  return (
    <section id="pricing" className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Pricing
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            We’re finalising plans tailored for MSPs. Register interest and
            we’ll keep you posted.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          {/* Background layer (gradient + subtle grid) */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
                backgroundSize: "22px 22px",
                color: "#0f172a" /* slate-900 (used as grid dot color) */,
              }}
            />
            <div className="absolute -top-24 -right-24 size-[420px] rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-400/10" />
          </div>

          {/* Frosted overlay */}
          <div className="backdrop-blur-sm bg-white/40 dark:bg-slate-900/30 p-4 sm:p-6">
            {/* Solid content card to ensure readability */}
            <div
              className="relative mx-auto max-w-3xl rounded-xl border
                            bg-white/95 dark:bg-slate-900/80
                            border-slate-200/70 dark:border-slate-700/60 p-8 shadow-sm"
            >
              <div
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs
                              border-amber-300/70 bg-amber-50/80 text-amber-800
                              dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200"
              >
                Preview
              </div>

              <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Pricing coming soon
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Transparent per-tenant plans with a free trial and early-bird
                perks. We’ll announce tiers shortly.
              </p>
              {/* 
              <div className="mt-6 flex items-center justify-center gap-3">
                <a
                  href="#waitlist"
                  className="inline-flex items-center rounded-full bg-orange-500 px-5 py-2 text-white hover:bg-orange-600"
                >
                  Join the waitlist
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center rounded-full border px-5 py-2
                             border-slate-300 text-slate-700 hover:bg-slate-50
                             dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800/60"
                >
                  Talk to us
                </a>
              </div> */}

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                We’re also offering free onboarding for the first cohort of
                MSPs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------- scrolling logo strip -------------------------- */
function LogoMarquee() {
  const baseLogos = useMemo(
    () => [
      { src: "/logos/microsoft250.png", alt: "Microsoft 365" },
      { src: "/logos/Veeam250.png", alt: "Veeam" },
      { src: "/logos/mimecast250.png", alt: "Mimecast" },
      { src: "/logos/meraki250.png", alt: "Meraki" },
      { src: "/logos/datto250.png", alt: "Datto" },
      { src: "/logos/acronis250.png", alt: "Acronis" },
      { src: "/logos/webroot250.png", alt: "Webroot" },
      { src: "/logos/AutoElevate250.png", alt: "AutoElevate" },
      { src: "/logos/automate250.png", alt: "ConnectWise RMM" },
      { src: "/logos/unifi250.png", alt: "Unifi" },
      { src: "/logos/sonicwall250.png", alt: "Sonicwall" },
      { src: "/logos/storagecraft250.png", alt: "StorageCraft" },
      { src: "/logos/usecure250.png", alt: "uSecure" },
      { src: "/logos/keeper250.png", alt: "Keeper" },
      { src: "/logos/barracuda250.png", alt: "Barracuda" },
      { src: "/logos/auvik250.png", alt: "Auvik" },
      { src: "/logos/fortinet250.png", alt: "Fortinet" },
      { src: "/logos/knowbe4250.png", alt: "KnowBe4" },
      { src: "/logos/activtrak250.png", alt: "ActivTrak" },
      { src: "/logos/arcserve250.png", alt: "Arcserve" },
      { src: "/logos/cove250.png", alt: "Cove" },
      { src: "/logos/crossware250.png", alt: "Crossware" },
      { src: "/logos/mailstore250.png", alt: "MailStore" },
      { src: "/logos/miradore250.png", alt: "Miradore" },
      { src: "/logos/phishingbox250.png", alt: "PhishingBox" },
      { src: "/logos/qualys250.png", alt: "Qualys" },
      { src: "/logos/skykick250.png", alt: "Skykick" },
      { src: "/logos/smtp2go250.png", alt: "SMTP2Go" },
      { src: "/logos/zyxel250.png", alt: "Zyxel" },
    ],
    []
  );

  // duplicate for seamless loop
  const logos = useMemo(() => [...baseLogos, ...baseLogos], [baseLogos]);

  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  const [showAll, setShowAll] = useState(false);

  return (
    <section className="bg-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-left text-slate-300 text-sm uppercase tracking-wider">
          Auto-detects products from your PSA
        </p>

        <div
          ref={ref}
          className="relative mt-8 overflow-hidden rounded-xl ring-1 ring-white/5 group"
        >
          {/* edge masks to avoid harsh ends */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10 bg-gradient-to-l from-slate-900 via-slate-900/70 to-transparent" />

          <div
            className={cn(
              "flex items-center gap-10 whitespace-nowrap py-6 transition-transform",
              inView && !reduced && "animate-marquee"
            )}
            aria-hidden="true"
          >
            {logos.map((l, i) => (
              <div
                key={`${l.alt}-${i}`}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                title={l.alt}
                aria-label={l.alt}
              >
                <Image
                  src={l.src}
                  alt={l.alt}
                  width={220}
                  height={88}
                  className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-90"
                  priority={i < 6}
                />
              </div>
            ))}
          </div>

          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(0%);
              }
              100% {
                transform: translateX(-50%);
              }
            }

            .animate-marquee {
              animation: marquee 60s linear infinite;
            }

            .group:hover .animate-marquee {
              animation-play-state: paused !important;
            }
          `}</style>
        </div>

        {/* CTA to show everything */}
        <div className="mt-6 flex justify-left">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setShowAll(true)}
          >
            View full catalog
          </Button>
        </div>

        {/* Dark dialog with all logos (no light/dark juggling) */}
        <Dialog open={showAll} onOpenChange={setShowAll}>
          <DialogContent className="max-w-4xl bg-slate-900 text-slate-100 border border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">
                Supported products
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[70vh] overflow-auto">
              {baseLogos.map((l) => (
                <div
                  key={l.alt}
                  className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 p-3"
                  title={l.alt}
                  aria-label={l.alt}
                >
                  <Image
                    src={l.src}
                    alt={l.alt}
                    width={220}
                    height={88}
                    loading="lazy"
                    className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-90"
                  />
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

/* ----------------------------- feature card ----------------------------- */
function FeatureCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur p-6
                    hover:shadow-md transition-shadow
                    border-slate-200/70 dark:border-slate-700/60"
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{children}</p>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute -top-24 -right-24 size-[400px] rounded-full bg-orange-200/30 dark:bg-orange-400/10 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              One pane for every client’s{" "}
              <span className="text-orange-600">products & services.</span>
            </h1>
            <p className="mt-4 text-lg text-slate-700 dark:text-slate-300">
              ScopeGrid reads your <b>PSA (ConnectWise or Halo)</b> to build a
              clean dashboard per customer. See M365, security, backup,
              networking and more—with quick links to each portal.
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Secure • tenant-scoped • built for MSPs
            </p>
            <Suspense fallback={<div>Loading Booker…</div>}>
              <ScheduleDemoButton />
            </Suspense>
          </div>

          <div className="lg:col-span-7 overflow-hidden">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<ScanSearch className="h-6 w-6" />}
            title="Automatic discovery from your PSA"
          >
            We read agreements, additions and configurations in{" "}
            <b>ConnectWise or Halo</b> to identify the tools each client uses—no
            manual tagging.
          </FeatureCard>

          <FeatureCard
            icon={<PanelsTopLeft className="h-6 w-6" />}
            title="Clean, card-based client view"
          >
            Vendor logos, clear descriptions and deep links. Filter fast and
            find what you need in seconds.
          </FeatureCard>

          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Secure by design"
          >
            Everything is scoped to your team and the selected client.
            Credentials are encrypted and never exposed in the browser.
          </FeatureCard>

          <FeatureCard
            icon={<PlugZap className="h-6 w-6" />}
            title="Fast, cache-aware experience"
          >
            Smart batching and caching keep pages snappy—even for larger
            tenants.
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section className="py-14 bg-white dark:bg-slate-950" id="integrations">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Integrations built for MSP workflows
            </h2>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTEGRATIONS.map((integration) => (
            <IntegrationCard key={integration.slug} integration={integration} />
          ))}
        </div>

        {/* Roadmap section (can also be registry-driven if desired) */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Also on our roadmap:
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            NinjaOne
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            Autotask
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            Crewhu
          </span>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="relative py-16 bg-slate-950 dark:bg-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute -top-24 right-1/4 h-64 w-64 rounded-full bg-orange-400/10 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-50">
          How ScopeGrid works
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-4">
          {/* Data sources */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <Database className="h-5 w-5" />
              <span className="text-sm font-semibold">Data in</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Your PSA + signals
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              We read agreements, additions and configurations from{" "}
              <b>ConnectWise or Halo</b>. Optional integrations (BackupRadar,
              CIPP, SmileBack) add health and posture context.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• No agents to deploy</li>
              <li>• Least-privilege credentials</li>
              <li>• Server-side proxy; encrypted at rest</li>
            </ul>
          </div>

          {/* Matching engine */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <GitMerge className="h-5 w-5" />
              <span className="text-sm font-semibold">Matching</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Catalog + simple rules
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Products are matched from a curated catalog. You can add your own
              terms per team or client for extra precision.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Deterministic and explainable</li>
              <li>• Per-client overrides when needed</li>
            </ul>
          </div>

          {/* Security / tenancy */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Security & scope</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Tenant isolation
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Views are locked to your team and the selected client. Credentials
              are never sent to the browser.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Row-level scoping in data access</li>
              <li>• Audit-friendly, minimal data retention</li>
            </ul>
          </div>

          {/* Performance */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ServerCog className="h-5 w-5" />
              <span className="text-sm font-semibold">Performance</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Fast by default
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Smart batching and caching keep the UI responsive, even with lots
              of clients and products.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Scales to large tenants</li>
              <li>• Quick filtering and search</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Media query hook that avoids SSR mismatches */
function useIsDesktop(minWidth = 640) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width:${minWidth}px)`);
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener?.("change", update);
    return () => mql.removeEventListener?.("change", update);
  }, [minWidth]);
  return isDesktop;
}

/** Renders a Sheet on mobile and a Dialog on desktop — but never both */
function ResponsiveModal({
  trigger,
  title,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const isDesktop = useIsDesktop(); // null on first SSR render
  const [open, setOpen] = useState(false);

  // Until we know the viewport (first client paint), render just the trigger to avoid double-mount
  if (isDesktop === null) {
    return <span>{trigger}</span>;
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription className="sr-only">{title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            {children}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4 text-sm text-slate-700 dark:text-slate-300">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TrustFooter() {
  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-slate-950">
      {/* top band */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/70 dark:to-slate-900/40" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {/* heading */}
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-slate-50">
              Built for UK MSPs. Secure, compliant, and transparent.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              ScopeGrid is a UK-based company. Data stays in the UK;
              authentication is in the EU. We follow GDPR and least-privilege
              best practices, including Microsoft GDAP.
            </p>
          </div>

          {/* trust pillars */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Data residency */}
            <div className="rounded-2xl border bg-slate-900/60 backdrop-blur p-5 border-slate-700/60">
              <div className="flex items-center gap-2 text-orange-400">
                <Database className="h-5 w-5" />
                <span className="text-sm font-semibold">UK Data Residency</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Hosted on Vercel (UK region) with Postgres on Neon (London). All
                data encrypted in transit & at rest.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                <li>• UK data centres</li>
                <li>• TLS everywhere, AES-256 at rest</li>
              </ul>
            </div>

            {/* GDPR & DPA */}
            <div className="rounded-2xl border bg-slate-900/60 backdrop-blur p-5 border-slate-700/60">
              <div className="flex items-center gap-2 text-orange-400">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-semibold">GDPR (UK/EU)</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                We operate as a processor with a clear DPA, minimal retention,
                and rapid breach-notification commitments.
              </p>
              <div className="mt-3">
                <ResponsiveModal
                  title="Data Processing Addendum (DPA)"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 px-0 underline"
                    >
                      View DPA →
                    </Button>
                  }
                >
                  <p>
                    This DPA forms part of your agreement with ScopeGrid Ltd
                    (“Processor”) and applies to personal data we process on
                    your behalf.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>
                      <b>Roles & scope</b>: Processor acts on documented
                      instructions.
                    </li>
                    <li>
                      <b>Purpose</b>: deliver client product dashboards and
                      access control.
                    </li>
                    <li>
                      <b>Data</b>: user names/emails, tenant/company
                      identifiers, limited PSA metadata; no special categories
                      intended.
                    </li>
                    <li>
                      <b>Security</b>: UK hosting, encryption in transit/at
                      rest, tenant isolation, least-privilege.
                    </li>
                    <li>
                      <b>Sub-processors</b>: Vercel (UK), Neon (London),
                      Frontegg (EU).
                    </li>
                    <li>
                      <b>Incidents</b>: notify without undue delay.
                    </li>
                    <li>
                      <b>Deletion</b>: delete/return upon termination where
                      legally permitted.
                    </li>
                  </ul>
                  <p className="text-xs mt-3">
                    Questions:{" "}
                    <a
                      className="underline"
                      href="mailto:privacy@scopegrid.app"
                    >
                      privacy@scopegrid.app
                    </a>
                  </p>
                </ResponsiveModal>
              </div>
            </div>

            {/* GDAP / least privilege */}
            <div className="rounded-2xl border bg-slate-900/60 backdrop-blur p-5 border-slate-700/60">
              <div className="flex items-center gap-2 text-orange-400">
                <LockKeyhole className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Least-Privilege & GDAP
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Microsoft Granular Delegated Admin Privileges (GDAP) ready.
                Explicit consent, minimum permissions.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-slate-400">
                <li>• Zero-trust principles</li>
                <li>• You remain in control</li>
              </ul>
            </div>

            {/* Company & certifications */}
            <div className="rounded-2xl border bg-slate-900/60 backdrop-blur p-5 border-slate-700/60">
              <div className="flex items-center gap-2 text-orange-400">
                <Building2 className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  UK Company & Standards
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Founded by a former MSP technician turned software developer.
                ISO&nbsp;27001 on our roadmap.
              </p>
              <div className="mt-3">
                <ResponsiveModal
                  title="About ScopeGrid"
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-300 px-0 underline"
                    >
                      Our story →
                    </Button>
                  }
                >
                  <p>
                    Our founder started in MSP support, moved through
                    engineering and systems integration, led PSA↔product
                    integrations & automated billing reconciliation, then built
                    bespoke LOB apps. ScopeGrid turns those lessons into a
                    simple, PSA-aware client dashboard.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>PSA-first discovery (ConnectWise & Halo), no agents</li>
                    <li>Clean product cards with deep links</li>
                    <li>UK data residency; transparent security</li>
                    <li>Fast onboarding and hands-on support</li>
                  </ul>
                </ResponsiveModal>
              </div>
            </div>
          </div>

          {/* quick FAQ row */}
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-100">
                Where is my data stored?
              </h4>
              <p className="mt-2 text-sm text-slate-300">
                UK regions (app + database). Authentication runs in the EU.
                Other regions are planned.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">
                Are you PSA-agnostic?
              </h4>
              <p className="mt-2 text-sm text-slate-300">
                Yes—ConnectWise and Halo today. We detect products & services
                with minimal setup.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">
                Do you help with onboarding?
              </h4>
              <p className="mt-2 text-sm text-slate-300">
                Absolutely. We’ll integrate your PSA, tune matchings, and get
                you live quickly.
              </p>
            </div>
          </div>

          {/* bottom strip */}
          <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <Globe2 className="h-4 w-4" />
              <span>UK data residency</span>
              <span className="mx-2">•</span>
              <ResponsiveModal
                title="Security Overview"
                trigger={
                  <button className="underline text-slate-300">Security</button>
                }
              >
                <p>
                  Least-privilege by default. Tenant isolation and server-side
                  PSA proxies (no agents).
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    Hosting: Vercel (UK); DB: Neon (London); Auth: Frontegg (EU)
                  </li>
                  <li>Encryption in transit & at rest; secrets protected</li>
                  <li>GDAP-aligned permissions; minimal retention</li>
                  <li>Incident response with rapid notification</li>
                </ul>
                <p className="text-xs mt-3">
                  Report a concern:{" "}
                  <a className="underline" href="mailto:security@scopegrid.app">
                    security@scopegrid.app
                  </a>
                </p>
              </ResponsiveModal>
              <span className="mx-2">•</span>
              <ResponsiveModal
                title="Data Processing Addendum (DPA)"
                trigger={
                  <button className="underline text-slate-300">DPA</button>
                }
              >
                <p>
                  We’re a processor under UK/EU GDPR. Key points include roles &
                  scope, sub-processors, and deletion.
                </p>
                <p className="text-xs mt-3">
                  <a className="underline" href="mailto:privacy@scopegrid.app">
                    privacy@scopegrid.app
                  </a>
                </p>
              </ResponsiveModal>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Link href="#" className="underline text-slate-300">
                Privacy
              </Link>
              <span className="text-slate-400">/</span>
              <a
                href="mailto:jim@scopegrid.app"
                className="inline-flex items-center gap-1 underline text-slate-300"
              >
                <Mail className="h-4 w-4" />
                jim@scopegrid.app
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* copyright bar */}
      <div className="border-t border-slate-800/70 bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/ScopeGridLogo.png"
              alt="ScopeGrid"
              width={120}
              height={30}
              className="h-6 w-auto dark:opacity-90"
            />
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} ScopeGrid Ltd. All rights reserved.
            </span>
          </div>
          <div className="mt-3 sm:mt-0 text-xs text-slate-400">
            Registered in England & Wales. UK-based team & support.
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------- the page ------------------------------- */
export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <main className="bg-white dark:bg-slate-950 overflow-x-hidden">
        {/* Logo */}
        {/* <LeftLogo /> */}
        {/* Hero */}
        <Hero />
        {/* Logo marquee */}
        <LogoMarquee />
        {/* Features */}
        {/* <Features /> */}
        {/* Integrations (sell the value; no “not done yet”) */}
        <Integrations />
        {/* How it works */}
        <HowItWorks />
        {/* Pricing */}
        <PricingSectionClient />
        {/* <PricingTeaser /> */}
        <TrustFooter />
      </main>
    </Suspense>
  );
}

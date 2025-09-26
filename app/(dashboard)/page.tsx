"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import WaitlistForm from "./WaitlistForm";

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
function LeftLogo() {
  return (
    <div className="relative pt-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-left justify-left">
          <img
            src="/ScopeGridLogoLight.png"
            alt="ScopeGrid"
            width={560}
            height={140}
            className="h-16 sm:h-20 md:h-24 w-auto drop-shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Pricing section ----------------------------- */
function PricingSection() {
  const [billing, setBilling] = React.useState<"monthly" | "annual">("monthly");

  const tiers = [
    {
      name: "Starter",
      blurb: "Great for small MSPs getting started.",
      priceMonthly: 49, // during beta
      priceAnnual: 0,
      badge: "Beta",
      features: [
        "Standalone Dashboard only",
        "Company picker & product cards",
        "ConnectWise discovery",
        "Detects inbuilt products only",
        "Email support",
      ],
      cta: { label: "Start free trial", href: "/sign-up" },
      highlighted: false,
    },
    {
      name: "Pro",
      blurb: "Deeper integrations & more seats.",
      priceMonthly: 99,
      priceAnnual: 999,
      badge: "Most popular",
      features: [
        "iFrame embedding (IT Glue, Cloud Radial, etc.)",
        "Custom match overrides for products",
        "BackupRadar • CIPP • SmileBack",
        "Priority support",
        "Early-bird onboarding included",
      ],
      cta: { label: "Start 14-day trial", href: "/sign-up" },
      highlighted: true,
    },
    {
      name: "Team",
      badge: "",
      blurb: "For larger MSPs & advanced workflows.",
      priceMonthly: 199,
      priceAnnual: 1990,
      features: [
        "Everything in Pro",
        "SSO/SAML (soon)",
        "Role-based access (soon)",
        "ConnectWise PSA Pods",
        "Add custom products and matching logic",
      ],
      cta: { label: "Talk to us", href: "/contact" },
      highlighted: false,
    },
  ] as const;

  return (
    <section id="pricing" className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* top banner */}
        <div
          className="mb-6 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/40
                        bg-emerald-50/70 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200
                        px-4 py-3 text-sm"
        >
          <b>Early-bird offer:</b> free onboarding assistance for the first{" "}
          <b>25 MSPs</b> +<b> 20% lifetime discount</b>. No credit card needed
          for trial.
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Simple, MSP-friendly pricing
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              14-day free trial on paid plans. Cancel anytime.
            </p>
          </div>

          {/* billing toggle */}
          <div
            className="inline-flex items-center gap-2 rounded-full border
                          border-slate-200/70 dark:border-slate-700/60 p-1 bg-white/60 dark:bg-slate-900/60"
          >
            <button
              onClick={() => setBilling("monthly")}
              className={`px-3 py-1.5 rounded-full text-sm ${
                billing === "monthly"
                  ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-3 py-1.5 rounded-full text-sm ${
                billing === "annual"
                  ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              Annual <span className="ml-1 opacity-70">(2 months free)</span>
            </button>
          </div>
        </div>

        {/* cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => {
            const price =
              billing === "monthly" ? t.priceMonthly : t.priceAnnual;
            const suffix = billing === "monthly" ? "/mo" : "/yr";

            return (
              <div
                key={t.name}
                className={[
                  "rounded-2xl border p-6 backdrop-blur",
                  "bg-white/90 dark:bg-slate-900/60",
                  "border-slate-200/70 dark:border-slate-700/60",
                  t.highlighted ? "ring-2 ring-orange-500/60" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                      {t.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {t.blurb}
                    </p>
                  </div>
                  {t.badge && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        t.badge === "Most popular"
                          ? "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-900/40 dark:bg-orange-900/30 dark:text-orange-200"
                          : "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {t.badge}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  {price === 0 ? (
                    <div className="text-3xl font-bold">Free</div>
                  ) : (
                    <div className="text-3xl font-bold">
                      £{price}{" "}
                      <span className="text-base font-normal text-slate-500">
                        {suffix}
                      </span>
                    </div>
                  )}
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 rounded-full bg-emerald-500" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  <Button asChild className="w-full rounded-full">
                    <Link href={t.cta.href}>{t.cta.label}</Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
          Pricing shown is indicative during beta and may change before GA.
          Early-bird discounts are locked in for qualifying customers. Taxes may
          apply.
        </p>
      </div>
    </section>
  );
}

function PricingTeaser() {
  return (
    <section id="pricing" className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Pricing</h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            We’re finalising plans tailored for MSPs. Register interest and we’ll keep you posted.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-700/60">
          {/* Background layer (gradient + subtle grid) */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-100/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
                 style={{
                   backgroundImage:
                     'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                   backgroundSize: '22px 22px',
                   color: '#0f172a' /* slate-900 (used as grid dot color) */,
                 }}
            />
            <div className="absolute -top-24 -right-24 size-[420px] rounded-full bg-orange-300/25 blur-3xl dark:bg-orange-400/10" />
          </div>

          {/* Frosted overlay */}
          <div className="backdrop-blur-sm bg-white/40 dark:bg-slate-900/30 p-4 sm:p-6">
            {/* Solid content card to ensure readability */}
            <div className="relative mx-auto max-w-3xl rounded-xl border
                            bg-white/95 dark:bg-slate-900/80
                            border-slate-200/70 dark:border-slate-700/60 p-8 shadow-sm">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs
                              border-amber-300/70 bg-amber-50/80 text-amber-800
                              dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
                Preview
              </div>

              <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">
                Pricing coming soon
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Transparent per-tenant plans with a free trial and early-bird perks. We’ll announce tiers shortly.
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
                We’re also offering free onboarding for the first cohort of MSPs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- mock dashboard matching the app ------------------- */
function MockDashboard() {
  const logos = [
    {
      light: "/logos/meraki250_light.png",
      dark: "/logos/meraki250.png",
      alt: "Cisco Meraki",
    },
    {
      light: "/logos/microsoft250.png",
      dark: "/logos/microsoft250.png",
      alt: "Microsoft 365",
    },
    {
      light: "/logos/AutoElevate250_light.png",
      dark: "/logos/AutoElevate250.png",
      alt: "AutoElevate",
    },
    {
      light: "/logos/automate250_light.png",
      dark: "/logos/automate250.png",
      alt: "ConnectWise RMM",
    },
  ];

  return (
    <div className="relative w-full">
      <div className="pointer-events-none absolute -inset-8 rounded-[28px] bg-gradient-to-tr from-orange-300/20 via-orange-200/10 to-transparent blur-2xl" />
      <div
        className="relative rounded-2xl overflow-hidden
                      border border-slate-200/70 dark:border-slate-700/60
                      bg-white/85 dark:bg-slate-900/60 backdrop-blur"
      >
        {/* app-like header bar */}
        <div
          className="flex items-center justify-between h-12 px-4
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-7 w-40 rounded-full bg-white/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-700/60" />
          </div>
        </div>

        {/* grid of product cards (condensed like your real cards) */}
        <div className="p-4 sm:p-6">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
            {logos.map((l, i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden
                           bg-white/85 dark:bg-slate-900/65
                           border border-slate-200/70 dark:border-slate-700/60
                           hover:shadow-md hover:border-slate-300/70 dark:hover:border-slate-600/70
                           transition-all"
              >
                {/* header with logo + link icon (no extra vertical space) */}
                <div className="flex items-start justify-between px-3 pt-3">
                  <img
                    src={l.light}
                    alt={l.alt}
                    width={220}
                    height={120}
                    className="max-h-10 w-auto object-contain"
                  />
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full
                                   bg-slate-100/80 dark:bg-slate-800/70 border
                                   border-slate-200/70 dark:border-slate-700/60"
                  >
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </span>
                </div>
                {/* description area */}
                <div className="px-3 pb-3 pt-2 text-sm leading-snug text-muted-foreground min-h-[56px]">
                  {l.alt}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- scrolling logo strip -------------------------- */
function LogoMarquee() {
  const baseLogos = useMemo(
    () => [
      { src: "/logos/microsoft250.png", alt: "Microsoft 365" },
      { src: "/logos/sentinel250.png", alt: "SentinelOne" },
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
      // add more here freely
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
          className="relative mt-8 overflow-hidden rounded-xl ring-1 ring-white/5"
        >
          {/* edge masks to avoid harsh ends */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-16 z-10 bg-gradient-to-r from-slate-900 via-slate-900/70 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-16 z-10 bg-gradient-to-l from-slate-900 via-slate-900/70 to-transparent" />

          <div
            className={[
              "flex items-center gap-10 will-change-transform whitespace-nowrap py-6",
              reduced ? "" : "sg-marquee",
              inView ? "" : "sg-paused",
            ].join(" ")}
            aria-hidden="true"
            // longer = slower; tweak freely
            style={
              reduced
                ? undefined
                : ({ ["--sg-speed" as any]: "160s" } as React.CSSProperties)
            }
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
            .sg-marquee {
              animation: sg-scroll var(--sg-speed, 300s) linear infinite;
            }
            .sg-paused {
              animation-play-state: paused !important;
            }
            @media (prefers-reduced-motion: reduce) {
              .sg-marquee {
                animation: none !important;
                transform: none !important;
              }
            }
            @keyframes sg-scroll {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
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
                    className="max-h-10 w-auto object-contain"
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
              ScopeGrid auto-builds a clean dashboard per customer using{" "}
              <b>ConnectWise agreements & configurations</b>. See M365,
              security, backup, RMM and more—with deep links to each portal.
            </p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Secure — tenant-scoped — built for MSPs
            </p>
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
            title="ConnectWise-powered discovery"
          >
            We read agreement additions and configurations to auto-detect each
            customer’s tools. No manual tagging required.
          </FeatureCard>
          <FeatureCard
            icon={<PanelsTopLeft className="h-6 w-6" />}
            title="Clean, card-based UI"
          >
            Product cards with vendor logos and deep links. Fast filtering and
            search. Built for quick customer context.
          </FeatureCard>
          <FeatureCard
            icon={<ShieldCheck className="h-6 w-6" />}
            title="Tenant isolation"
          >
            Scoped by team, optional subdomains, and encrypted credentials.
            Customer-locked views for AMs and techs.
          </FeatureCard>
          <FeatureCard
            icon={<PlugZap className="h-6 w-6" />}
            title="Snappy & cache-aware"
          >
            Bundle endpoints minimize API calls and keep pages fast—even on
            large tenants.
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
          {/* <Link
              href="/settings/integrations"
              className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              Manage integrations
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link> */}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ConnectWise */}
          <div
            className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60
                      bg-white/90 dark:bg-slate-900/60 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/logos/square/connectwise.png"
                  alt="ConnectWise"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span className="font-medium">ConnectWise</span>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]
                           border-emerald-200 bg-emerald-50 text-emerald-700
                           dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                ● Direct API
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Agreement additions & configurations power automatic product
              discovery and customer dashboards.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Per-client views
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Zero agents
              </span>
            </div>
          </div>

          {/* BackupRadar */}
          <div
            className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60
                      bg-white/90 dark:bg-slate-900/60 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/integrations/backupradar.png"
                  alt="BackupRadar"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span className="font-medium">BackupRadar</span>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]
                           border-blue-200 bg-blue-50 text-blue-700
                           dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-300"
              >
                ● Health signals
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Surface backup success/failure context alongside each customer’s
              tools to speed triage.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Client rollups
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Failure drill-downs
              </span>
            </div>
          </div>

          {/* CIPP */}
          <div
            className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60
                      bg-white/90 dark:bg-slate-900/60 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/integrations/cipp.png"
                  alt="CIPP"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span className="font-medium">CIPP (M365)</span>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]
                           border-indigo-200 bg-indigo-50 text-indigo-700
                           dark:border-indigo-900/40 dark:bg-indigo-900/30 dark:text-indigo-300"
              >
                ● Posture
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Show tenant posture and quick actions right where your team is
              already working.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Secure score
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Task links
              </span>
            </div>
          </div>

          {/* SmileBack */}
          <div
            className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60
                      bg-white/90 dark:bg-slate-900/60 backdrop-blur p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/integrations/smileback.png"
                  alt="SmileBack"
                  width={28}
                  height={28}
                  className="h-7 w-7"
                />
                <span className="font-medium">SmileBack</span>
              </div>
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]
                           border-amber-200 bg-amber-50 text-amber-700
                           dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300"
              >
                ● Feedback
              </span>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Put CSAT/NPS context next to the tools your AMs and techs discuss
              with customers.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Trends
              </span>
              <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                Ticket links
              </span>
            </div>
          </div>
        </div>

        {/* Optional “coming soon” strip */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            Also on our roadmap:
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            NinjaOne
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            HaloPSA
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            Autotask
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300">
            ITGlue
          </span>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="relative py-16 bg-slate-950">
      {/* soft gradient + glow */}
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
              ConnectWise + integrations
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              We ingest <b>agreements, additions, and configurations</b> from
              ConnectWise via our bundle endpoints. Optional integrations
              (BackupRadar, CIPP, SmileBack, etc.) enrich each product card with
              health or posture context.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Zero agents, PSA-first discovery</li>
              <li>• Throttled, cache-aware requests</li>
              <li>• Per-team credentials; encrypted at rest</li>
            </ul>
          </div>

          {/* Matching engine */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <GitMerge className="h-5 w-5" />
              <span className="text-sm font-semibold">Matching</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Catalog + terms + overrides
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Each vendor/product in our catalog has <i>matchTerms</i>. We scan
              CW additions & config text (SKU, description, xrefs) and match on
              lower-cased terms. Teams can add <b>override terms</b> globally or
              per-company.
            </p>
            <pre className="mt-3 text-[11px] leading-5 text-slate-300/90 bg-slate-950/60 border border-slate-800 rounded-lg p-3 overflow-x-auto">
              {`haystack = (additions + configs).toLowerCase()
terms = product.matchTerms + team.overrides[slug] (+ company overrides)
if any(term in haystack): matched <- product`}
            </pre>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Deterministic & explainable</li>
              <li>• Company-specific tuning when needed</li>
            </ul>
          </div>

          {/* Security / tenancy */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Security & scope</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Tenant isolation by design
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Everything is scoped by <b>team</b> and the selected{" "}
              <b>companyIdentifier</b>. Overrides are stored per-team,
              optionally per-company. API keys are encrypted, least-privilege,
              and never exposed to the browser.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Server-side proxy for third-party calls</li>
              <li>• Row-level scoping in data access</li>
              <li>• Audit-friendly, minimal data retention</li>
            </ul>
          </div>

          {/* Architecture / performance */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-6">
            <div className="flex items-center gap-2 text-orange-400">
              <ServerCog className="h-5 w-5" />
              <span className="text-sm font-semibold">Architecture</span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">
              Fast, typed, and cache-aware
            </h3>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Next.js app with typed data via <b>Drizzle ORM</b> and Postgres.
              Bundle endpoints reduce round-trips to CW. UI is lightweight,
              cached where safe, and revalidates as you switch companies.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>• Chunked requests for large tenants</li>
              <li>• Optimistic UI for overrides</li>
              <li>• Dark-mode first, accessible components</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Waitlist() {
  return (
    <section className="py-16 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-left mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Get early access
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Join the waitlist and we’ll keep you posted with meaningful updates.
          </p>
        </div>
        <div
          className="rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur p-6 shadow-sm
                          border-slate-200/70 dark:border-slate-700/60"
        >
          <WaitlistForm />
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            We respect your inbox — no spam, ever.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- the page ------------------------------- */
export default function HomePage() {
  return (
    <main className="bg-white dark:bg-slate-950 overflow-x-hidden">
      {/* Logo */}
      <LeftLogo />
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
      {/* <PricingSection /> */}
      <PricingTeaser />
      {/* Waitlist */}
      <Waitlist />
    </main>
  );
}

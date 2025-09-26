"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  PanelsTopLeft,
  ScanSearch,
  ShieldCheck,
  PlugZap,
  ArrowRight,
  ExternalLink,
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

/* -------------------------- centered wordmark -------------------------- */
function CenterLogo() {
  return (
    <div className="relative pt-1">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-1 h-24 w-[420px] rounded-full bg-orange-300/20 dark:bg-orange-400/10 blur-2xl"
      />
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

/* --------------------------- logo marquee (unchanged) --------------------------- */
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
    ],
    []
  );
  const logos = useMemo(() => [...baseLogos, ...baseLogos], [baseLogos]);

  const { ref, inView } = useInView<HTMLDivElement>();
  const reduced = usePrefersReducedMotion();

  return (
    <div className="bg-slate-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-slate-300 text-sm uppercase tracking-wider">
          Auto-detects from your ConnectWise data
        </p>
        <div
          ref={ref}
          className="group relative mt-8 overflow-hidden rounded-xl bg-slate-900/40 ring-1 ring-white/5"
        >
          <div
            className={`flex items-center gap-12 will-change-transform whitespace-nowrap py-6 ${
              reduced ? "" : "marquee"
            } ${inView ? "" : "paused"} group-hover:paused`}
            aria-hidden="true"
          >
            {logos.map((l, i) => (
              <Image
                key={`${l.alt}-${i}`}
                src={l.src}
                alt={l.alt}
                width={220}
                height={88}
                className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-85 hover:opacity-100 transition"
              />
            ))}
          </div>
          <style jsx>{`
            .marquee {
              animation: marquee 60s linear infinite;
            }
            .paused {
              animation-play-state: paused !important;
            }
            @media (prefers-reduced-motion: reduce) {
              .marquee {
                animation: none;
                transform: none;
              }
            }
            @keyframes marquee {
              0% {
                transform: translateX(0);
              }
              100% {
                transform: translateX(-50%);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
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

/* ------------------------------- the page ------------------------------- */
export default function HomePage() {
  return (
    <main className="bg-white dark:bg-slate-950">
      <CenterLogo />

      {/* hero */}
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
                <span className="text-orange-600">products & configs.</span>
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

            <div className="lg:col-span-7">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      <LogoMarquee />

      {/* Features */}
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

      {/* Integrations (sell the value; no “not done yet”) */}
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
                Put CSAT/NPS context next to the tools your AMs and techs
                discuss with customers.
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

      {/* How it works */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            How ScopeGrid works
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur p-6 border-slate-200/70 dark:border-slate-700/60">
              <div className="text-sm font-semibold text-orange-600">
                Step 1
              </div>
              <h3 className="mt-1 text-lg font-semibold">Create your team</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Sign up, invite teammates, and (optionally) claim a subdomain
                for a clean tenant URL.
              </p>
            </div>
            <div className="rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur p-6 border-slate-200/70 dark:border-slate-700/60">
              <div className="text-sm font-semibold text-orange-600">
                Step 2
              </div>
              <h3 className="mt-1 text-lg font-semibold">
                Connect ConnectWise
              </h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Add site URL, company ID, and API keys. We encrypt at rest and
                test the connection.
              </p>
            </div>
            <div className="rounded-2xl border bg-white/90 dark:bg-slate-900/60 backdrop-blur p-6 border-slate-200/70 dark:border-slate-700/60">
              <div className="text-sm font-semibold text-orange-600">
                Step 3
              </div>
              <h3 className="mt-1 text-lg font-semibold">Pick a company</h3>
              <p className="mt-2 text-slate-600 dark:text-slate-300">
                Use the header picker. We auto-detect their stack and render
                product cards with deep links to each portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section className="py-16 bg-white dark:bg-slate-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Get early access
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Join the waitlist and we’ll keep you posted with meaningful
              updates.
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
    </main>
  );
}

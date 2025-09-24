import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  PanelsTopLeft,
  ScanSearch,
  ShieldCheck,
  PlugZap,
  ArrowRight,
} from 'lucide-react';

/* ----------------- Floating mock dashboard (distinct look) ----------------- */
function MockDashboard() {
  const logos = [
    { src: '/logos/microsoft250.png', alt: 'Microsoft 365' },
    { src: '/logos/sentinel250.png', alt: 'SentinelOne' },
    { src: '/logos/Veeam250_light.png', alt: 'Veeam' },
    { src: '/logos/mimecast250.png', alt: 'Mimecast' },
    { src: '/logos/meraki250.png', alt: 'Cisco Meraki' },
    { src: '/logos/datto250.png', alt: 'Datto' },
    { src: '/logos/acronis250_light.png', alt: 'Acronis' },
    { src: '/logos/webroot250_light.png', alt: 'Webroot' },
  ];

  return (
    <div className="relative w-full">
      {/* glow */}
      <div className="pointer-events-none absolute -inset-8 rounded-[28px] bg-gradient-to-tr from-orange-300/30 via-orange-200/20 to-transparent blur-2xl" />
      <div className="relative border rounded-2xl shadow-sm bg-white/90 backdrop-blur-sm overflow-hidden">
        {/* faux toolbar */}
        <div className="flex items-center gap-2 h-10 px-4 border-b bg-white">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-green-400" />
          <div className="ml-3 text-xs text-gray-500 truncate">ScopeGrid — Client Products</div>
        </div>
        {/* search/filter bar mock */}
        <div className="flex gap-2 items-center px-4 py-3 border-b bg-orange-50/60">
          <div className="h-8 w-40 rounded-full bg-white border" />
          <div className="h-8 w-24 rounded-full bg-white border" />
          <div className="h-8 w-24 rounded-full bg-white border" />
        </div>
        {/* grid */}
        <div className="p-4 sm:p-6">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {logos.map((l, i) => (
              <div
                key={i}
                className="border rounded-xl h-28 bg-white flex items-center justify-center hover:shadow-sm transition-shadow"
                aria-label={l.alt}
                title={l.alt}
              >
                <Image
                  src={l.src}
                  alt={l.alt}
                  width={240}
                  height={120}
                  className="max-h-12 w-auto object-contain"
                  priority={i < 4}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Logo wall -------------------------------- */
function LogoWall() {
  const logos = [
    { src: '/logos/microsoft250.png', alt: 'Microsoft 365' },
    { src: '/logos/sentinel250.png', alt: 'SentinelOne' },
    { src: '/logos/Veeam250.png', alt: 'Veeam' },
    { src: '/logos/mimecast250.png', alt: 'Mimecast' },
    { src: '/logos/meraki250.png', alt: 'Meraki' },
    { src: '/logos/datto250.png', alt: 'Datto' },
    { src: '/logos/acronis250.png', alt: 'Acronis' },
    { src: '/logos/webroot250.png', alt: 'Webroot' },
  ];
  return (
    <div className="bg-gray-900 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-300 text-sm uppercase tracking-wider">
          Auto-detects from your ConnectWise data
        </p>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-6 items-center justify-items-center">
          {logos.map((l, i) => (
            <Image
              key={i}
              src={l.src}
              alt={l.alt}
              width={220}
              height={88}
              className="h-10 sm:h-12 md:h-14 w-auto object-contain opacity-90 hover:opacity-100 transition"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Feature card block --------------------------- */
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
    <div className="rounded-2xl border bg-white p-6 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-orange-500 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-gray-600">{children}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main>
      {/* Distinct hero layout (gradient + asymmetrical) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-white" />
        <div className="absolute -top-24 -right-24 size-[400px] rounded-full bg-orange-200/30 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                One pane for every client’s{' '}
                <span className="text-orange-600">products & configs.</span>
              </h1>
              <p className="mt-4 text-lg text-gray-700">
                ScopeGrid auto-builds a clean dashboard per customer using{' '}
                <b>ConnectWise agreements & configurations</b>. See M365, security, backup, RMM and
                more—with deep links to each portal.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full">
                  <Link href="/sign-up">
                    Get started
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full">
                  <Link href="/dashboard">Try the dashboard</Link>
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Secure — tenant-scoped — built for MSPs
              </p>
            </div>

            <div className="lg:col-span-7">
              <MockDashboard />
            </div>
          </div>
        </div>
      </section>

      {/* Big, bold logo wall (larger & prominent) */}
      <LogoWall />

      {/* Features (new icons & copy) */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<ScanSearch className="h-6 w-6" />}
              title="ConnectWise-powered discovery"
            >
              We read agreement additions and configurations to auto-detect each customer’s tools.
              No manual tagging required.
            </FeatureCard>
            <FeatureCard
              icon={<PanelsTopLeft className="h-6 w-6" />}
              title="Clean, card-based UI"
            >
              Product cards with vendor logos and deep links. Fast filtering and search. Built for
              quick customer context.
            </FeatureCard>
            <FeatureCard icon={<ShieldCheck className="h-6 w-6" />} title="Tenant isolation">
              Scoped by team, optional subdomains, and encrypted credentials. Customer-locked views
              for AMs and techs.
            </FeatureCard>
            <FeatureCard icon={<PlugZap className="h-6 w-6" />} title="Snappy & cache-aware">
              Our proxy and bundle endpoints minimize API calls and keep pages fast—even on large
              tenants.
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* How it works (timeline) */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900">How ScopeGrid works</h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-orange-600">Step 1</div>
              <h3 className="mt-1 text-lg font-semibold">Create your team</h3>
              <p className="mt-2 text-gray-600">
                Sign up, invite teammates, and (optionally) claim a subdomain for a clean tenant URL.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-orange-600">Step 2</div>
              <h3 className="mt-1 text-lg font-semibold">Connect ConnectWise</h3>
              <p className="mt-2 text-gray-600">
                Add site URL, company ID, and API keys. We encrypt at rest and test the connection.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-semibold text-orange-600">Step 3</div>
              <h3 className="mt-1 text-lg font-semibold">Pick a company</h3>
              <p className="mt-2 text-gray-600">
                Use the header picker. We auto-detect their stack and render product cards with deep
                links to each portal.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/sign-up">
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

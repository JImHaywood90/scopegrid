// app/(dashboard)/settings/integrations/[slug]/page.tsx
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { bySlug } from "@/components/integrations/registry";
import IntegrationForm from "../../IntegrationForm"; // client component

type Params = { slug: string };

function FormFallback() {
  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 animate-pulse">
      <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-10 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-10 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export default async function IntegrationEditPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const meta = bySlug[slug];

  if (!meta) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="mb-4">
          <Link
            href="/settings/integrations"
            className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </div>
        <h1 className="text-lg lg:text-2xl font-medium">Integrations</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Unknown integration: <code>{slug}</code>
        </p>
      </section>
    );
  }

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/settings/integrations"
          className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </div>

      <h1 className="text-lg lg:text-2xl font-medium mb-4">{meta.name}</h1>

      {/* Client component in Suspense to satisfy CSR-bailout */}
      <Suspense fallback={<FormFallback />}>
        <IntegrationForm slug={slug} />
      </Suspense>
    </section>
  );
}

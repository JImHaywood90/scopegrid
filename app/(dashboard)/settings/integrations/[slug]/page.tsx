// app/(dashboard)/settings/integrations/[slug]/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { bySlug } from "@/components/integrations/registry";
import IntegrationForm from "./IntegrationForm";

export default function IntegrationEditPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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

      {/* Integration form */}
      <IntegrationForm slug={slug} />
    </section>
  );
}

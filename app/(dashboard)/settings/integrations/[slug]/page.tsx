import { bySlug } from "@/components/integrations/registry";
import IntegrationForm from "./IntegrationForm";


export default function IntegrationEditPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const meta = bySlug[slug];

  if (!meta) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <h1 className="text-lg lg:text-2xl font-medium">Integrations</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Unknown integration: <code>{slug}</code>
        </p>
      </section>
    );
  }

  // Pass a plain string to the client component
  return <IntegrationForm slug={slug} />;
}

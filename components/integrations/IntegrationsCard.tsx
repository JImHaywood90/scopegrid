import Image from "next/image";
import { IntegrationMeta } from "@/components/integrations/registry";

type Props = { integration: IntegrationMeta };

export function IntegrationCard({ integration }: Props) {
  const { name, logoLight, description, highlight, tags = [] } = integration;

  const highlightClasses = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-300",
    indigo: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/30 dark:text-indigo-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300",
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/60 bg-white/90 dark:bg-slate-900/60 backdrop-blur p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src={logoLight}
            alt={name}
            width={28}
            height={28}
            className="h-7 w-7"
          />
          <span className="font-medium">{name}</span>
        </div>
        {highlight && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${highlightClasses[highlight.color]}`}
          >
            {highlight.text}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

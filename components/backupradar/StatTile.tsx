import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  color = "default", // optional color override
}: {
  label: string;
  value: string | number;
  color?: "default" | "success" | "warning" | "danger" | string;
}) {
  return (
    <Card
      className={cn(
        "min-w-[125px] max-h-[65px] flex flex-col justify-center px-4 py-2",
        color === "success" && "bg-green-100 dark:bg-green-900/20",
        color === "warning" && "bg-yellow-100 dark:bg-yellow-900/20",
        color === "danger" && "bg-red-100 dark:bg-red-900/20",
        color === "default" && "bg-muted"
      )}
    >
      <CardContent className="p-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DetailList({
  items,
  className,
}: {
  items: readonly (readonly [string, ReactNode])[];
  className?: string;
}) {
  return (
    <dl className={cn("grid gap-3 sm:grid-cols-2", className)}>
      {items.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="mt-1 text-sm break-words">
            {value === null || value === undefined || value === ""
              ? "Not provided"
              : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

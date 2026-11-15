import type { ComponentProps, CSSProperties } from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

// A small project chart wrapper following shadcn's composable Recharts approach.
export function ChartContainer({
  className,
  children,
  style,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  children: ComponentProps<typeof ResponsiveContainer>["children"];
}) {
  return (
    <div
      data-slot="chart"
      className={cn(
        "h-64 min-w-0 text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border",
        className,
      )}
      style={
        {
          "--color-count": "var(--color-action-primary, #194e65)",
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}
export const ChartTooltip = Tooltip;

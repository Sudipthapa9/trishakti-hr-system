import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

export function ApplicationVolumeChart({
  data,
  days,
}: {
  data: { day: string; count: number }[];
  days: number;
}) {
  return (
    <ChartContainer
      role="img"
      aria-label={`Daily application counts for the last ${days} days in Nepal time. Exact values are available in View daily counts.`}
    >
      <AreaChart
        accessibilityLayer
        data={data}
        margin={{ top: 12, right: 12, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          axisLine={false}
          tickLine={false}
          minTickGap={30}
          tickFormatter={(day: string) => day.slice(5)}
        />
        <YAxis
          allowDecimals={false}
          axisLine={false}
          tickLine={false}
          width={32}
          domain={[0, "auto"]}
        />
        <ChartTooltip
          contentStyle={{ borderRadius: 8 }}
          labelFormatter={(label) => String(label)}
        />
        <Area
          dataKey="count"
          name="Applications"
          type="linear"
          stroke="var(--color-count)"
          fill="var(--color-count)"
          fillOpacity={0.12}
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

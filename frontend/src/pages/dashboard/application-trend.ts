export type ApplicationTrend = {
  current: number;
  previous: number;
  dailyCounts: number[];
};

// The card total is all time; its badge compares two explicit seven-day windows.
export function applicationTrendPresentation(trend: ApplicationTrend) {
  const percent =
    trend.previous === 0
      ? null
      : ((trend.current - trend.previous) / trend.previous) * 100;
  const rounded = percent === null ? null : Math.round(percent);
  const badgeLabel =
    rounded === null
      ? trend.current > 0
        ? "New"
        : "0%"
      : `${rounded > 0 ? "+" : ""}${rounded}%`;
  return {
    badgeLabel,
    badgeTone:
      trend.current > trend.previous
        ? ("success" as const)
        : ("neutral" as const),
    description: `${trend.current} applications in the last 7 calendar days, including today, versus ${trend.previous} in the previous 7 days. Nepal time.`,
    chartDescription: `Daily applications over the last 7 calendar days in Nepal time, oldest first: ${trend.dailyCounts.join(", ")}.`,
  };
}

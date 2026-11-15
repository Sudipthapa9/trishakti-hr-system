/**
 * Displays a dashboard metric with an optional comparison badge and data-backed sparkline.
 */
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import type { LucideIcon } from "lucide-react";

// Define SummaryCardProps so callers and implementations agree on the required data shape.
type SummaryCardProps = {
  label: string;
  value: string;
  change?: string;
  badgeLabel?: string;
  badgeTone?: "default" | "success" | "warning" | "neutral" | "danger";
  icon?: LucideIcon;
  badgeDescription?: string;
  trendValues?: number[];
  trendDescription?: string;
};

// Missing history renders no chart rather than an invented illustrative trend.
export function SummaryCard({
  label,
  value,
  change = "",
  badgeLabel,
  badgeTone = "default",
  icon: Icon,
  badgeDescription,
  trendValues,
  trendDescription,
}: SummaryCardProps) {
  const values = trendValues?.filter(Number.isFinite) ?? [];
  const max = Math.max(1, ...values);
  const points = values
    .map(
      (count, index) =>
        `${2 + (index / (values.length - 1)) * 66},${30 - (count / max) * 26}`,
    )
    .join(" ");
  return (
    <Card className="summary-card rounded-2xl p-0">
      {/* Render the panel body using the shared spacing convention. */}
      <CardContent className="p-5">
        <div className="summary-card-top">
          {Icon ? (
            <span className="summary-card-icon">
              <Icon aria-hidden="true" size={20} />
            </span>
          ) : null}
          {badgeLabel ? (
            <Badge
              variant={badgeTone}
              title={badgeDescription}
              aria-label={
                badgeDescription
                  ? `${badgeLabel}. ${badgeDescription}`
                  : undefined
              }
            >
              {badgeLabel}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="summary-label">{label}</span>
        </div>
        <div className="summary-value">
          <strong>{value}</strong>
          {values.length > 1 && (
            <svg
              viewBox="0 0 70 34"
              className="summary-sparkline"
              role="img"
              aria-label={trendDescription || "Metric history"}
            >
              <polyline
                points={points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        {change ? (
          <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {change}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

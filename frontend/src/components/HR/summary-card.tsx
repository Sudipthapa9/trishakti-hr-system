/**
 * Displays one dashboard metric with optional status feedback and an illustrative miniature trend graphic.
 */
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import type { LucideIcon } from "lucide-react";

// Define SummaryCardProps so callers and implementations agree on the required data shape.
type SummaryCardProps = {
  label: string;
  value: string;
  change: string;
  badgeLabel?: string;
  badgeTone?: "default" | "success" | "warning" | "neutral" | "danger";
  icon?: LucideIcon;
};

// Displays one dashboard metric with optional status feedback and an illustrative miniature trend graphic.
export function SummaryCard({
  label,
  value,
  change,
  badgeLabel,
  badgeTone = "default",
  icon: Icon,
}: SummaryCardProps) {
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
          {badgeLabel ? <Badge variant={badgeTone}>{badgeLabel}</Badge> : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="summary-label">{label}</span>
        </div>
        <div className="summary-value">
          <strong>{value}</strong>
          <svg
            viewBox="0 0 70 34"
            className="summary-sparkline"
            aria-hidden="true"
          >
            <path
              d="M1 26 Q8 13 16 22 T28 20 T40 15 T52 11 T68 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </svg>
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

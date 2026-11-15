/**
 * Displays a dashboard total with an optional status badge.
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
};

// Keep summary totals simple; the main dashboard chart handles activity data.
export function SummaryCard({
  label,
  value,
  change = "",
  badgeLabel,
  badgeTone = "default",
  icon: Icon,
  badgeDescription,
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

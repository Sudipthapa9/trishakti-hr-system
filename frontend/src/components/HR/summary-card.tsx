import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import type { LucideIcon } from "lucide-react";

type SummaryCardProps = {
  label: string;
  value: string;
  change: string;
  badgeLabel?: string;
  badgeTone?: "default" | "success" | "warning" | "neutral" | "danger";
  icon?: LucideIcon;
};

export function SummaryCard({
  label,
  value,
  change,
  badgeLabel,
  badgeTone = "default",
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card className="rounded-2xl p-0">
      <CardContent className="p-5">
        <div className="summary-card-top">
          {Icon ? <span className="summary-card-icon"><Icon aria-hidden="true" size={20} /></span> : null}
          {badgeLabel ? <Badge variant={badgeTone}>{badgeLabel}</Badge> : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-text-secondary)]">{label}</span>
        </div>
        <div className="mt-6 text-3xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)]">{value}</div>
        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{change}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
 */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { UserRound } from "lucide-react";
import { type ReactNode } from "react";

// Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
export function Person({
  name,
  detail,
  initials,
  className = "",
}: {
  name: string;
  detail?: string;
  initials?: string;
  className?: string;
}) {
  const fallback =
    initials ??
    name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("");
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <Avatar className="size-10 shrink-0">
        <AvatarFallback className="bg-accent text-sm font-semibold text-accent-foreground">
          {fallback}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{name}</p>
        {detail ? (
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

// Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
export function Metric({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: typeof UserRound;
}) {
  return (
    <Card>
      {/* Render the panel body using the shared spacing convention. */}
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
        </div>
        <span className="rounded-lg bg-accent p-2 text-accent-foreground">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

// Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
export function PanelTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
export function Score({
  value,
  large = false,
}: {
  value: number;
  large?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-primary/10 font-semibold text-primary ${large ? "px-4 py-2 text-2xl" : "px-2.5 py-1 text-xs"}`}
    >
      {value}%
      {large ? <span className="text-xs font-medium">MATCH</span> : null}
    </span>
  );
}

// Provides reusable profile, metric, title, score, and prototype-notice presentation helpers.
export function DemoNotice() {
  return (
    <p className="text-xs text-muted-foreground">
      Sample data for this prototype. Updates are kept in memory and are not
      sent to the HR API.
    </p>
  );
}

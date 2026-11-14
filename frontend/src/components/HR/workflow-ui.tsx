/**
 * Provides shared person presentation and the deferred screening score helper.
 */
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Provides shared person presentation and the deferred screening score helper.
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
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join("");
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <Avatar aria-hidden="true" className="size-10 shrink-0">
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

// Provides shared person presentation and the deferred screening score helper.
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

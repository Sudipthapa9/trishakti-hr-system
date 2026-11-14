/**
 * Renders a consistent page title, optional description, and contextual actions.
 */
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

// Define PageHeaderProps so callers and implementations agree on the required data shape.
type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

// Renders a consistent page title, optional description, and contextual actions.
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "page-heading flex flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>

      {action ? <div>{action}</div> : null}
    </header>
  );
}

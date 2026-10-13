import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between", className)}>
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)] md:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{description}</p> : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

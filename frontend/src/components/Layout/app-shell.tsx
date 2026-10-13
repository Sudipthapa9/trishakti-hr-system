import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

import { Sidebar, type NavItem } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
  navItems: NavItem[];
  username?: string;
  roleLabel?: string;
  onLogout?: () => void;
  headerAction?: ReactNode;
  topBar?: ReactNode;
  className?: string;
};

export function AppShell({
  children,
  navItems,
  username,
  roleLabel,
  onLogout,
  headerAction,
  topBar,
  className,
}: AppShellProps) {
  return (
    <main className={cn("flex min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]", className)}>
      <Sidebar navItems={navItems} username={username} roleLabel={roleLabel} onLogout={onLogout} />

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-4 md:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--color-action-primary)] text-xs font-bold text-[var(--color-text-inverse)]">
              T
            </div>
            <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">TSHR</span>
          </div>

          {topBar ? <div className="ml-auto">{topBar}</div> : null}
          {headerAction ? <div>{headerAction}</div> : null}
        </header>

        <div className="p-4 md:p-8">{children}</div>
      </div>
    </main>
  );
}

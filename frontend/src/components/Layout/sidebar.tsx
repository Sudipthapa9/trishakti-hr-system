import type { LucideIcon } from "lucide-react";
import { LogOut, UserRound } from "lucide-react";

import { Button } from "../ui/button";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type SidebarProps = {
  brandLabel?: string;
  title?: string;
  navItems: NavItem[];
  username?: string;
  roleLabel?: string;
  onLogout?: () => void;
};

export function Sidebar({
  brandLabel = "TSHR",
  title = "HR Suite",
  navItems,
  username = "User",
  roleLabel = "Standard user",
  onLogout,
}: SidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] p-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-action-primary)] text-sm font-bold text-[var(--color-text-inverse)]">
          T
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">{brandLabel}</div>
          <div className="text-lg font-bold text-[var(--color-text-primary)]">{title}</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
              active
                ? "bg-[var(--color-action-primary)] text-[var(--color-text-inverse)]"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-canvas)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>

      <div className="border-t border-[var(--color-border-default)] p-4">
        <div className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-canvas)] p-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-action-primary)]/10 text-[var(--color-action-primary)]">
            <UserRound className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{username}</div>
            <div className="truncate text-xs text-[var(--color-text-secondary)]">{roleLabel}</div>
          </div>
        </div>

        {onLogout ? (
          <Button variant="secondary" className="mt-4 w-full gap-2" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

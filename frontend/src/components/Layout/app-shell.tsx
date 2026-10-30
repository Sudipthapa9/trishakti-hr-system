import type { ReactNode } from "react";
import { Bell, LogOut, Search, UserRound, type LucideIcon } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  to: string;
  icon: LucideIcon;
};

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
  username = "User",
  roleLabel = "Standard user",
  onLogout,
  headerAction,
  topBar,
  className,
}: AppShellProps) {
  const location = useLocation();

  return (
    <TooltipProvider>
      <SidebarProvider className={cn("min-h-screen", className)}>
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                T
              </span>
              <div>
                <p className="m-0 text-lg font-bold leading-tight text-primary">Trishakti HR</p>
                <p className="m-0 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground">RECRUITMENT SUITE</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Workspace</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map(({ label, to, icon: Icon }) => {
                    const isActive =
                      location.pathname === to ||
                      (to !== "/dashboard" && location.pathname.startsWith(`${to}/`));

                    return (
                      <SidebarMenuItem key={label}>
                        <SidebarMenuButton asChild isActive={isActive} tooltip={label}>
                          <NavLink to={to} end={to === "/dashboard"}>
                            <Icon aria-hidden="true" />
                            <span>{label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter className="p-3">
            <div className="flex min-w-0 items-center gap-3 rounded-lg bg-sidebar-accent p-3 text-sidebar-accent-foreground">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <UserRound aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{username}</span>
                <span className="block truncate text-xs opacity-75">{roleLabel}</span>
              </span>
            </div>

            {onLogout ? (
              <Button variant="outline" className="mt-2 w-full justify-start" onClick={onLogout}>
                <LogOut aria-hidden="true" />
                <span>Sign out</span>
              </Button>
            ) : null}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="flex min-h-16 items-center gap-3 border-b border-border bg-background px-4 md:px-8">
            <SidebarTrigger className="md:hidden" />
            <div className="ml-auto flex min-w-0 items-center gap-4">
              <label className="shell-search hidden min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 md:flex">
                <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <Input aria-label="Search across Trishakti HR" placeholder="Search across Trishakti HR..." className="h-9 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" />
              </label>
              <Bell aria-hidden="true" className="hidden size-5 text-muted-foreground sm:block" />
              {topBar}
              {headerAction}
            </div>
          </header>

          <div className="min-w-0 p-4 md:p-8">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

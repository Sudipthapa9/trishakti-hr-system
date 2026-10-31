/**
 * Renders the shared workspace sidebar and header around page content, including responsive navigation.
 */
import { useSidebar } from "@/components/ui/sidebar-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  Bell,
  CircleHelp,
  LogOut,
  Plus,
  Search,
  Settings,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import "./app-shell.css";

// Define NavItem so callers and implementations agree on the required data shape.
export type NavItem = { label: string; to: string; icon: LucideIcon };
// Define AppShellProps so callers and implementations agree on the required data shape.
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
// Renders the shared workspace sidebar and header around page content, including responsive navigation.
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
  const { pathname } = useLocation();
  const dashboard = pathname === "/dashboard" || pathname === "/";
  const title = pathname.startsWith("/communication")
    ? "Communication Hub"
    : pathname.startsWith("/candidates")
      ? "Candidate Pipeline"
      : pathname.startsWith("/offers")
        ? "Generate Offer"
        : "Trikshati Poly Packs";
  return (
    <TooltipProvider>
      <SidebarProvider
        className={cn("hr-workspace", dashboard && "hr-dashboard", className)}
        style={{ "--sidebar-width": "17.5rem" } as CSSProperties}
      >
        {/* Keep shared workspace navigation outside page-specific content. */}
        <Sidebar className="hr-workspace workspace-sidebar">
          <SidebarHeader className="workspace-brand">
            <Link to="/dashboard">
              <span className="workspace-logo">{dashboard ? "R" : "T"}</span>
              <span>
                <strong>{dashboard ? "RecruitPro" : "Trikshati HR"}</strong>
                <small>
                  {dashboard ? "Enterprise HR" : "Recruitment Suite"}
                </small>
              </span>
            </Link>
            {dashboard ||
            pathname.startsWith("/onboarding") ||
            pathname.startsWith("/employees") ? (
              <Button asChild className="post-job">
                <Link to="/jobs/new">
                  <Plus />
                  Post New Job
                </Link>
              </Button>
            ) : null}
          </SidebarHeader>
          {/* Render the scrollable navigation region. */}
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <WorkspaceNavigation navItems={navItems} pathname={pathname} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          {/* Keep account and supporting actions at the end of the sidebar. */}
          <SidebarFooter className="workspace-footer">
            <details>
              <summary>
                <Settings size={18} /> Settings
              </summary>
              <p>Workspace settings are not connected in this prototype.</p>
            </details>
            <details>
              <summary>
                <CircleHelp size={18} /> Support
              </summary>
              <p>Contact your HR administrator for assistance.</p>
            </details>
            <div className="workspace-account">
              <span className="workspace-avatar">
                <UserRound size={19} />
              </span>
              <span>
                <strong>{username}</strong>
                <small>{roleLabel}</small>
              </span>
              {onLogout ? (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Sign out"
                  onClick={onLogout}
                >
                  <LogOut />
                </Button>
              ) : null}
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="workspace-inset">
          {/* Page or panel heading and contextual actions. */}
          <header className="workspace-header">
            <SidebarTrigger className="md:hidden" />
            {!dashboard &&
            !pathname.startsWith("/screening/") &&
            !pathname.startsWith("/jobs/new") &&
            !pathname.startsWith("/interviews") ? (
              <strong className="workspace-header-title">{title}</strong>
            ) : null}
            <label className="workspace-search">
              <Search size={16} />
              <Input
                aria-label="Search workspace"
                placeholder={
                  dashboard
                    ? "Search candidates, jobs..."
                    : pathname.startsWith("/interviews")
                      ? "Search interviews..."
                      : "Search across Trikshati HR..."
                }
              />
            </label>
            <div className="workspace-header-actions">
              <details>
                <summary aria-label="Notifications">
                  <Bell size={19} />
                  <i />
                </summary>
                <p>No new notifications.</p>
              </details>
              <CircleHelp size={18} />
              {dashboard ? (
                <span className="admin-panel">Admin Panel</span>
              ) : null}
              <span className="workspace-avatar" title={username}>
                <UserRound size={17} />
              </span>
              {headerAction}
            </div>
          </header>
          {/* Main screen content; shared navigation is composed separately. */}
          <main className="workspace-main">{children}</main>
          {topBar ? (
            <div className="workspace-prototype-note">{topBar}</div>
          ) : null}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

// Render route links and close the narrow-screen drawer after a destination is selected.
function WorkspaceNavigation({
  navItems,
  pathname,
}: {
  navItems: NavItem[];
  pathname: string;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <SidebarMenu>
      {navItems.map(({ label, to, icon: Icon }) => (
        <SidebarMenuItem key={to}>
          <SidebarMenuButton
            asChild
            isActive={
              pathname === to ||
              (to !== "/dashboard" && pathname.startsWith(to + "/"))
            }
            tooltip={label}
          >
            <NavLink to={to} onClick={() => setOpenMobile(false)}>
              <Icon aria-hidden="true" />
              <span>{label === "Overview" ? "Dashboard" : label}</span>
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

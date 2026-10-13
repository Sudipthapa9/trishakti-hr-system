import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleUserRound,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Search,
  UserRound,
  Users,
} from "lucide-react";

import keycloak from "./keycloak";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthState = "loading" | "signed-out" | "signed-in";

const navigationItems = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Jobs", icon: BriefcaseBusiness, active: false },
  { label: "Candidates", icon: Users, active: false },
  { label: "Interviews", icon: CalendarClock, active: false },
  { label: "Onboarding", icon: FolderKanban, active: false },
  { label: "Employees", icon: CircleUserRound, active: false },
];

const summaryCards = [
  { label: "Open positions", value: "24", change: "+4 this month", tone: "default" as const },
  { label: "Candidates", value: "1,284", change: "+128 today", tone: "success" as const },
  { label: "Interviews", value: "18", change: "3 due this week", tone: "warning" as const },
  { label: "Offers", value: "6", change: "2 pending review", tone: "neutral" as const },
];

const candidates = [
  { name: "Aarati Gurung", role: "Frontend Engineer", score: "96% match", stage: "Shortlisted", status: "success" as const },
  { name: "Nishan Khatri", role: "Operations Manager", score: "89% match", stage: "Interview", status: "warning" as const },
  { name: "Sabin Sharma", role: "HR Associate", score: "94% match", stage: "Offer", status: "neutral" as const },
  { name: "Pragya Shrestha", role: "Account Manager", score: "81% match", stage: "Review", status: "danger" as const },
];

function BrandMark() {
  return <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-action-primary)] text-base font-bold text-[var(--color-text-inverse)]">T</span>;
}

function AuthLanding() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="flex flex-col justify-between bg-[var(--color-action-primary)]/10 p-8 md:p-12 lg:p-16">
        <div className="inline-flex items-center gap-3 text-[var(--color-text-primary)]">
          <BrandMark />
          <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">TSHR</span>
        </div>

        <div className="max-w-xl py-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Trishakti HR</p>
          <h1 className="max-w-lg text-5xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)] md:text-6xl">People operations, made clearer.</h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[var(--color-text-secondary)]">
            A focused workspace for hiring, candidate screening, onboarding, and employee records.
          </p>
        </div>

        <p className="text-sm text-[var(--color-text-secondary)]">Secure access powered by Keycloak</p>
      </section>

      <section className="flex items-center justify-center bg-[var(--color-bg-surface)] p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">TSHR</span>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Welcome back</p>
          <h2 className="text-3xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">Sign in to TSHR</h2>
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Use your organization account to continue.</p>

          <div className="mt-8 space-y-3">
            <Button className="w-full" onClick={() => keycloak.login({ redirectUri: window.location.origin })}>Sign in</Button>
            <Button variant="secondary" className="w-full" onClick={() => keycloak.register({ redirectUri: window.location.origin })}>Create an account</Button>
            <button
              type="button"
              className="mt-2 block w-full text-center text-sm font-semibold text-[var(--color-action-primary)]"
              onClick={() => keycloak.login({ redirectUri: window.location.origin })}
            >
              Forgot your password?
            </button>
          </div>

          <p className="mt-8 text-center text-xs leading-6 text-[var(--color-text-secondary)]">
            Password recovery is handled securely by Keycloak. Select the forgot password link on the sign-in screen.
          </p>
        </div>
      </section>
    </main>
  );
}

function WelcomePage({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] p-6">
      <div className="w-full max-w-xl rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-10 text-center shadow-[0_20px_48px_rgba(29,40,38,0.08)]">
        <div className="mb-6 flex justify-center">
          <BrandMark />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">You are signed in</p>
        <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)]">Welcome to TSHR</h1>
        <p className="mt-5 text-base leading-7 text-[var(--color-text-secondary)]">
          Your Trishakti HR workspace is ready. We are building the next set of people operations tools for your team.
        </p>
        <div className="mt-8 flex justify-center">
          <Button size="lg" onClick={onContinue}>Continue to workspace</Button>
        </div>
        <p className="mt-6 text-sm text-[var(--color-text-secondary)]">More features are coming soon.</p>
      </div>
    </main>
  );
}

function Workspace({ onLogout }: { onLogout: () => void }) {
  const roles: string[] = keycloak.tokenParsed?.realm_access?.roles || [];
  const username = keycloak.tokenParsed?.preferred_username || "Unknown user";
  const relevantRoles = roles.filter((role) => ["hr", "hr-head", "manager"].includes(role));

  return (
    <main className="flex min-h-screen bg-[var(--color-bg-canvas)] text-[var(--color-text-primary)]">
      <aside className="hidden w-72 shrink-0 border-r border-[var(--color-border-default)] bg-[var(--color-bg-surface)] lg:flex lg:flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--color-border-default)] p-6">
          <BrandMark />
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Trishakti</div>
            <div className="text-lg font-bold">HR Suite</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          {navigationItems.map(({ label, icon: Icon, active }) => (
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
              <div className="truncate text-sm font-semibold">{username}</div>
              <div className="truncate text-xs text-[var(--color-text-secondary)]">{relevantRoles.length > 0 ? relevantRoles.join(", ") : "Standard user"}</div>
            </div>
          </div>

          <Button variant="secondary" className="mt-4 w-full" onClick={onLogout}>Sign out</Button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-4 md:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <BrandMark />
            <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">TSHR</span>
          </div>

          <div className="relative ml-auto w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <Input placeholder="Search candidates, jobs, or teams" className="pl-9" />
          </div>

          <button type="button" className="grid h-10 w-10 place-items-center rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)]">
            <Bell className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 p-4 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Dashboard</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)] md:text-4xl">Talent overview</h1>
            </div>

            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Job
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map(({ label, value, change, tone }) => (
              <div key={label} className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-5 shadow-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">{label}</span>
                  <Badge variant={tone}>{tone === "default" ? "Live" : tone === "success" ? "Good" : tone === "warning" ? "Watch" : "Info"}</Badge>
                </div>
                <div className="mt-6 text-3xl font-bold tracking-[-0.05em]">{value}</div>
                <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{change}</div>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-4 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Pipeline</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">Recent candidates</h2>
              </div>

              <Button variant="outline" className="gap-2">
                This week
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-[var(--color-border-default)]">
              <div className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] gap-4 bg-[var(--color-bg-canvas)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                <span>Candidate</span>
                <span>Role</span>
                <span>Score</span>
                <span>Status</span>
              </div>

              {candidates.map(({ name, role, score, stage, status }) => (
                <div key={name} className="grid grid-cols-[1.3fr_1fr_0.8fr_0.8fr] items-center gap-4 border-t border-[var(--color-border-default)] bg-[var(--color-bg-surface)] px-4 py-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-action-primary)]/10 text-[var(--color-action-primary)] font-semibold">{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
                    <div>
                      <div className="font-semibold text-[var(--color-text-primary)]">{name}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">Updated 2h ago</div>
                    </div>
                  </div>

                  <span className="text-[var(--color-text-secondary)]">{role}</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{score}</span>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={status}>{stage}</Badge>
                    <button type="button" className="text-[var(--color-action-primary)] hover:text-[var(--color-action-primary-hover)]">
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Hiring task</p>
                  <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">Offer generation</h3>
                </div>
                <CheckCircle2 className="h-5 w-5 text-[var(--color-status-success)]" />
              </div>

              <div className="mt-6 space-y-4">
                {[
                  "Candidate profile reviewed",
                  "Reference checks approved",
                  "Compensation package finalized",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-xl bg-[var(--color-bg-canvas)] p-3">
                    <div className="grid h-6 w-6 place-items-center rounded-full bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-sm text-[var(--color-text-primary)]">{item}</div>
                    <span className="text-xs text-[var(--color-text-secondary)]">{index + 1}/3</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">Documents</p>
              <h3 className="mt-2 text-xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">Checklist</h3>

              <div className="mt-6 space-y-3">
                {[
                  { label: "Offer letter", state: "Ready" },
                  { label: "Background checks", state: "Pending" },
                  { label: "Employee profile", state: "Draft" },
                ].map(({ label, state }) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-[var(--color-bg-canvas)] p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      <span className="text-sm text-[var(--color-text-primary)]">{label}</span>
                    </div>
                    <Badge variant={state === "Ready" ? "success" : state === "Pending" ? "warning" : "neutral"}>{state}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [showWelcome, setShowWelcome] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    keycloak.onAuthLogout = () => {
      setAuthState("signed-out");
      setShowWelcome(false);
    };

    keycloak
      .init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false })
      .then((authenticated) => {
        setAuthState(authenticated ? "signed-in" : "signed-out");
        setShowWelcome(authenticated);
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        setAuthState("signed-out");
      });
  }, []);

  if (authState === "loading") {
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] text-[var(--color-action-primary)]">
        <div className="text-center">
          <BrandMark />
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Connecting securely...</p>
        </div>
      </main>
    );
  }

  if (authState === "signed-out") return <AuthLanding />;
  if (showWelcome) return <WelcomePage onContinue={() => setShowWelcome(false)} />;

  return <Workspace onLogout={() => keycloak.logout({ redirectUri: window.location.origin })} />;
}

export default App;

import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, LayoutDashboard, Users } from "lucide-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppShell, type NavItem } from "@/components/Layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initialCandidates, initialJobs } from "@/data/demo-data";
import { CandidatesPage } from "@/pages/candidates-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { JobsPage, NewJobPage } from "@/pages/jobs-page";
import type { Candidate, CandidateStage, Job, JobStatus } from "@/types/hr";

import keycloak from "./keycloak";

type AuthState = "loading" | "signed-out" | "signed-in";

function getAuthRedirectUri() {
  return `${window.location.origin}/`;
}

const navigationItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Jobs", icon: BriefcaseBusiness, to: "/jobs" },
  { label: "Candidates", icon: Users, to: "/candidates" },
];

function BrandMark() {
  return (
    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-action-primary)] text-base font-bold text-[var(--color-text-inverse)]">
      T
    </span>
  );
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
            <Button className="w-full" onClick={() => keycloak.login({ redirectUri: getAuthRedirectUri() })}>Sign in</Button>
            <Button variant="secondary" className="w-full" onClick={() => keycloak.register({ redirectUri: getAuthRedirectUri() })}>Create an account</Button>
            <button
              type="button"
              className="mt-2 block w-full text-center text-sm font-semibold text-[var(--color-action-primary)]"
              onClick={() => keycloak.login({ redirectUri: getAuthRedirectUri() })}
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
        <div className="mb-6 flex justify-center"><BrandMark /></div>
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

function NotFoundPage() {
  return (
    <section className="page-stack">
      <h1>Page not found</h1>
      <p className="demo-note">This screen has not been added to the frontend yet.</p>
      <Button asChild><Link to="/dashboard-page">Back to overview</Link></Button>
    </section>
  );
}

function Workspace({ onLogout }: { onLogout: () => void }) {
  const roles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const username = keycloak.tokenParsed?.preferred_username ?? "Unknown user";
  const relevantRoles = roles.filter((role) => ["hr", "hr-head", "manager"].includes(role));
  const roleLabel = relevantRoles.length > 0 ? relevantRoles.join(", ") : "Standard user";
  const [jobs, setJobs] = useState(initialJobs);
  const [candidates, setCandidates] = useState(initialCandidates);

  function updateJobStatus(jobId: string, status: JobStatus) {
    setJobs((currentJobs) =>
      currentJobs.map((job) => {
        if (job.id !== jobId) return job;

        if (status === "Archived") {
          return {
            ...job,
            previousStatus: job.status === "Archived" ? job.previousStatus : job.status,
            status,
          };
        }

        return { ...job, status, previousStatus: undefined };
      })
    );
  }

  function createJob(newJob: Omit<Job, "id" | "applicants">) {
    setJobs((currentJobs) => [
      { ...newJob, id: `job-${Date.now()}`, applicants: 0 },
      ...currentJobs,
    ]);
  }

  function updateCandidateStage(candidateId: string, stage: CandidateStage) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, stage, updated: "Just now" } : candidate
      )
    );
  }

  return (
    <WorkspaceRoutes
      username={username}
      roleLabel={roleLabel}
      onLogout={onLogout}
      jobs={jobs}
      candidates={candidates}
      onJobStatusChange={updateJobStatus}
      onCreateJob={createJob}
      onCandidateStageChange={updateCandidateStage}
    />
  );
}

type WorkspaceRoutesProps = {
  username: string;
  roleLabel: string;
  onLogout: () => void;
  jobs: Job[];
  candidates: Candidate[];
  onJobStatusChange: (jobId: string, status: JobStatus) => void;
  onCreateJob: (job: Omit<Job, "id" | "applicants">) => void;
  onCandidateStageChange: (candidateId: string, stage: CandidateStage) => void;
};

function WorkspaceRoutes({
  username,
  roleLabel,
  onLogout,
  jobs,
  candidates,
  onJobStatusChange,
  onCreateJob,
  onCandidateStageChange,
}: WorkspaceRoutesProps) {
  return (
    <AppShell
      navItems={navigationItems}
      username={username}
      roleLabel={roleLabel}
      onLogout={onLogout}
      topBar={<Badge variant="neutral">Frontend demo</Badge>}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage jobs={jobs} candidates={candidates} />} />
        <Route path="/jobs" element={<JobsPage jobs={jobs} onStatusChange={onJobStatusChange} />} />
        <Route path="/jobs/new" element={<NewJobPage onCreate={onCreateJob} />} />
        <Route path="/candidates" element={<CandidatesPage candidates={candidates} onStageChange={onCandidateStageChange} />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
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

  if (authState === "signed-out") return <BrowserRouter><AuthLanding /></BrowserRouter>;
  if (showWelcome) return <WelcomePage onContinue={() => setShowWelcome(false)} />;

  return (
    <BrowserRouter>
      <Workspace onLogout={() => keycloak.logout({ redirectUri: getAuthRedirectUri() })} />
    </BrowserRouter>
  );
}

export default App;

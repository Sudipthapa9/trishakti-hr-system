import { useEffect, useRef, useState } from "react";
import { BriefcaseBusiness, CalendarDays, FileText, LayoutDashboard, Mail, ScanSearch, UserRound, Users, UserRoundCheck } from "lucide-react";
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { AppShell, type NavItem } from "@/components/Layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { initialCandidates, initialJobs } from "@/data/demo-data";
import { CandidatesPage } from "@/pages/candidates/candidates-page";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { JobsPage } from "@/pages/recruitment/jobs-page";
import { NewJobPage } from "@/pages/recruitment/new-job-page";
import { AuthLanding } from "@/pages/auth/auth-landing";
import { BrandMark } from "@/pages/auth/brand-mark";
import { WelcomePage } from "@/pages/auth/welcome-page";
import { CandidateAnalysisPage } from "@/pages/screening/candidate-analysis-page";
import { ScreeningRankingPage } from "@/pages/screening/screening-ranking-page";
import { InterviewsPage } from "@/pages/interviews/interviews-page";
import { CommunicationPage } from "@/pages/recruitment/communication-page";
import { OfferGenerationPage } from "@/pages/recruitment/offer-generation-page";
import { OnboardingPage } from "@/pages/onboarding/onboarding-page";
import { EmployeeRecordPage } from "@/pages/employees/employee-record-page";
import { ApplicationConfirmationPage } from "@/pages/public/application-confirmation-page";
import { JobDetailsPage } from "@/pages/public/job-details-page";
import { CareersPage } from "@/pages/public/careers-page";
import { PublicNotFoundPage } from "@/pages/public/not-found-page";
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
  { label: "AI screening", icon: ScanSearch, to: "/screening" },
  { label: "Interviews", icon: CalendarDays, to: "/interviews" },
  { label: "Communication", icon: Mail, to: "/communication" },
  { label: "Offers", icon: FileText, to: "/offers/new" },
  { label: "Onboarding", icon: UserRoundCheck, to: "/onboarding/eleanor-shellstrop" },
  { label: "Employees", icon: UserRound, to: "/employees/eleanor-shellstrop" },
];

function NotFoundPage() {
  return (
    <section className="page-stack">
      <h1>Page not found</h1>
      <p className="demo-note">The page you are looking for is not available.</p>
      <div className="flex gap-2">
        <Button asChild><Link to="/dashboard">Back to overview</Link></Button>
        <Button asChild variant="outline"><Link to="/careers">View careers site</Link></Button>
      </div>
    </section>
  );
}

function PublicRoutes({ jobs }: { jobs: Job[] }) {
  return (
    <Routes>
      <Route path="/careers" element={<CareersPage jobs={jobs} />} />
      <Route path="/careers/:jobId/application/confirmation" element={<ApplicationConfirmationPage />} />
      <Route path="/careers/:jobId/application" element={<JobDetailsPage jobs={jobs} />} />
      <Route path="/careers/:jobId" element={<JobDetailsPage jobs={jobs} />} />
      <Route path="*" element={<PublicNotFoundPage />} />
    </Routes>
  );
}

function SignedOutView() {
  const location = useLocation();
  return location.pathname === "/404" || location.pathname === "/careers" || location.pathname.startsWith("/careers/")
    ? <PublicRoutes jobs={initialJobs} />
    : <AuthLanding />;
}

function SignedInView({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  return location.pathname === "/404" || location.pathname === "/careers" || location.pathname.startsWith("/careers/")
    ? <PublicRoutes jobs={initialJobs} />
    : <Workspace onLogout={onLogout} />;
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
        <Route path="/screening" element={<ScreeningRankingPage jobs={jobs} candidates={candidates} onStageChange={onCandidateStageChange} />} />
        <Route path="/screening/:candidateId" element={<CandidateAnalysisPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/communication" element={<CommunicationPage candidates={candidates} />} />
        <Route path="/offers/new" element={<OfferGenerationPage candidates={candidates} />} />
        <Route path="/onboarding" element={<Navigate to="/onboarding/eleanor-shellstrop" replace />} />
        <Route path="/onboarding/:candidateId" element={<OnboardingPage />} />
        <Route path="/employees" element={<Navigate to="/employees/eleanor-shellstrop" replace />} />
        <Route path="/employees/:employeeId" element={<EmployeeRecordPage />} />
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

  if (authState === "signed-out") return <BrowserRouter><SignedOutView /></BrowserRouter>;
  if (showWelcome) return <WelcomePage onContinue={() => setShowWelcome(false)} />;

  return (
    <BrowserRouter>
      <SignedInView onLogout={() => keycloak.logout({ redirectUri: getAuthRedirectUri() })} />
    </BrowserRouter>
  );
}

export default App;

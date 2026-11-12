/**
 * Combines shared navigation with database jobs and sample candidate state; Outlet renders the selected workspace page.
 */
import { useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Mail,
  ScanSearch,
  UserRound,
  Users,
  UserRoundCheck,
} from "lucide-react";
import { Outlet } from "react-router-dom";
import { AppShell, type NavItem } from "@/components/Layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/auth/auth-context";
import { initialCandidates } from "@/data/demo-data";
import { WorkspaceContext } from "@/data/workspace-context";
import keycloak from "@/keycloak";
import { requestJobs, saveDraft, updateJob, type JobChanges } from "@/data/jobs-api";
import type { CandidateStage, Job, JobStatus } from "@/types/hr";

// Keep navigation labels, icons, and destinations in one shared list.
const navigationItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Jobs", icon: BriefcaseBusiness, to: "/jobs" },
  { label: "Applications", icon: FileText, to: "/applications" },
  { label: "Candidates", icon: Users, to: "/candidates" },
  { label: "AI screening", icon: ScanSearch, to: "/screening" },
  { label: "Interviews", icon: CalendarDays, to: "/interviews" },
  { label: "Communication", icon: Mail, to: "/communication" },
  { label: "Offers", icon: FileText, to: "/offers/new" },
  {
    label: "Onboarding",
    icon: UserRoundCheck,
    to: "/onboarding",
  },
  { label: "Employees", icon: UserRound, to: "/employees" },
];

// Combines shared navigation with database jobs and sample candidate state; Outlet renders the selected workspace page.
export function WorkspaceLayout() {
  const { username, roleLabel, logout } = useAuth();
  // Keep jobs in component state; updates trigger a render.
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    requestJobs(controller.signal)
      .then((records) => {
        if (!controller.signal.aborted) setJobs(records);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setJobsError(error instanceof Error ? error.message : "Could not load jobs.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setJobsLoading(false);
      });
    return () => controller.abort();
  }, []);
  // Keep candidates in component state; updates trigger a render.
  const [candidates, setCandidates] = useState(initialCandidates);

  async function editJob(id: string, changes: JobChanges) {
    const saved = await updateJob(id, changes);
    setJobs((current) => current.map((job) => job.id === id ? saved : job));
  }

  async function updateJobStatus(id: string, status: JobStatus) {
    await editJob(id, { status });
  }

  // Add the saved database record only after the API confirms creation.
  async function createJob(newJob: Omit<Job, "id" | "applicants">) {
    if (!keycloak.authenticated) throw new Error("Please sign in again.");
    const saved = await saveDraft(newJob);
    setJobs((current) => [saved, ...current]);
  }

  // Change the matching candidate stage and update its relative timestamp in shared state.
  function updateCandidateStage(candidateId: string, stage: CandidateStage) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, stage, updated: "Just now" }
          : candidate,
      ),
    );
  }

  return (
    <WorkspaceContext.Provider
      value={{
        jobs,
        jobsLoading,
        jobsError,
        candidates,
        updateJobStatus,
        editJob,
        createJob,
        updateCandidateStage,
      }}
    >
      <AppShell
        navItems={navigationItems}
        username={username}
        roleLabel={roleLabel}
        onLogout={logout}
        topBar={<Badge variant="neutral">Frontend demo</Badge>}
      >
        {/* Render the child route selected by React Router. */}
        <Outlet />
      </AppShell>
    </WorkspaceContext.Provider>
  );
}

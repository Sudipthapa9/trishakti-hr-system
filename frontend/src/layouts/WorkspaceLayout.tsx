/**
 * Combines shared navigation with in-memory jobs and candidate state; Outlet renders the selected workspace page.
 */
import { useState } from "react";
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
import { initialCandidates, initialJobs } from "@/data/demo-data";
import { WorkspaceContext } from "@/data/workspace-context";
import type { CandidateStage, Job, JobStatus } from "@/types/hr";

// Keep navigation labels, icons, and destinations in one shared list.
const navigationItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Jobs", icon: BriefcaseBusiness, to: "/jobs" },
  { label: "Candidates", icon: Users, to: "/candidates" },
  { label: "AI screening", icon: ScanSearch, to: "/screening" },
  { label: "Interviews", icon: CalendarDays, to: "/interviews" },
  { label: "Communication", icon: Mail, to: "/communication" },
  { label: "Offers", icon: FileText, to: "/offers/new" },
  {
    label: "Onboarding",
    icon: UserRoundCheck,
    to: "/onboarding/eleanor-shellstrop",
  },
  { label: "Employees", icon: UserRound, to: "/employees/eleanor-shellstrop" },
];

// Combines shared navigation with in-memory jobs and candidate state; Outlet renders the selected workspace page.
export function WorkspaceLayout() {
  const { username, roleLabel, logout } = useAuth();
  // Keep jobs in component state; updates trigger a render.
  const [jobs, setJobs] = useState(initialJobs);
  // Keep candidates in component state; updates trigger a render.
  const [candidates, setCandidates] = useState(initialCandidates);

  // Change only the matching job; remember its previous status so archiving can be reversed.
  function updateJobStatus(jobId: string, status: JobStatus) {
    setJobs((currentJobs) =>
      currentJobs.map((job) => {
        if (job.id !== jobId) return job;

        // Keep the prior active/draft state so Restore can reverse this local archive action.
        if (status === "Archived") {
          return {
            ...job,
            previousStatus:
              job.status === "Archived" ? job.previousStatus : job.status,
            status,
          };
        }

        return { ...job, status, previousStatus: undefined };
      }),
    );
  }

  // Prepend a new in-memory vacancy with a local identifier and zero applicants.
  function createJob(newJob: Omit<Job, "id" | "applicants">) {
    setJobs((currentJobs) => [
      { ...newJob, id: `job-${Date.now()}`, applicants: 0 },
      ...currentJobs,
    ]);
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
        candidates,
        updateJobStatus,
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

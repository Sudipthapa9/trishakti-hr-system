/**
 * Connects shared workspace data to page props, keeping route declarations separate from data wiring.
 */
import { useWorkspace } from "@/data/workspace-context";
import { DashboardPage } from "@/pages/dashboard/dashboard-page";
import { JobsPage } from "@/pages/recruitment/jobs-page";
import { NewJobPage } from "@/pages/recruitment/new-job-page";
import { CandidatesPage } from "@/pages/candidates/candidates-page";
import { ScreeningRankingPage } from "@/pages/screening/screening-ranking-page";
import { CommunicationPage } from "@/pages/recruitment/communication-page";
import { OfferGenerationPage } from "@/pages/recruitment/offer-generation-page";

// Read the required workspace values and pass them to the corresponding page component.
export function DashboardRoute() {
  const { jobs, candidates } = useWorkspace();
  return <DashboardPage jobs={jobs} candidates={candidates} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function JobsRoute() {
  const { jobs, updateJobStatus } = useWorkspace();
  return <JobsPage jobs={jobs} onStatusChange={updateJobStatus} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function NewJobRoute() {
  const { createJob } = useWorkspace();
  return <NewJobPage onCreate={createJob} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function CandidatesRoute() {
  const { candidates, updateCandidateStage } = useWorkspace();
  return (
    <CandidatesPage
      candidates={candidates}
      onStageChange={updateCandidateStage}
    />
  );
}

// Read the required workspace values and pass them to the corresponding page component.
export function ScreeningRankingRoute() {
  const { jobs, candidates, updateCandidateStage } = useWorkspace();
  return (
    <ScreeningRankingPage
      jobs={jobs}
      candidates={candidates}
      onStageChange={updateCandidateStage}
    />
  );
}

// Read the required workspace values and pass them to the corresponding page component.
export function CommunicationRoute() {
  const { candidates } = useWorkspace();
  return <CommunicationPage candidates={candidates} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function OfferGenerationRoute() {
  const { candidates } = useWorkspace();
  return <OfferGenerationPage candidates={candidates} />;
}

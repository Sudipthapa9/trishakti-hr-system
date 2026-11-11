/**
 * Connects shared workspace data to page props, keeping route declarations separate from data wiring.
 */
import { useParams } from "react-router-dom";
import type { JobChanges } from "@/data/jobs-api";
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
  const { jobs, jobsLoading, jobsError, updateJobStatus } = useWorkspace();
  if (jobsLoading) return <p role="status">Loading jobs…</p>;
  if (jobsError) return <p role="alert">{jobsError}</p>;
  return <JobsPage jobs={jobs} onStatusChange={updateJobStatus} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function NewJobRoute() {
  const { createJob } = useWorkspace();
  return <NewJobPage onCreate={createJob} />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function CandidatesRoute() {
  return <CandidatesPage />;
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
  return <CommunicationPage />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function OfferGenerationRoute() {
  return <OfferGenerationPage />;
}


// Reuse the complete job form for editing the selected database record.
export function EditJobRoute() {
  const { jobId } = useParams();
  const { jobs, jobsLoading, jobsError, editJob } = useWorkspace();
  if (jobsLoading) return <p role="status">Loading job…</p>;
  if (jobsError) return <p role="alert">{jobsError}</p>;
  const job = jobs.find((record) => record.id === jobId);
  if (!job) return <p role="alert">Job not found.</p>;
  return <NewJobPage key={job.id} initialJob={job} onCreate={async (changes) => {
    // Saving details preserves the current published/archived status.
    const details: JobChanges = { ...changes };
    delete details.status;
    await editJob(job.id, details);
  }} />;
}

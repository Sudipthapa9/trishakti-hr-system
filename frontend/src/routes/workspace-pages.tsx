import { FeedbackMessage } from "@/components/shared/feedback/feedback-message";
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
  return <DashboardPage />;
}

// Read the required workspace values and pass them to the corresponding page component.
export function JobsRoute() {
  const { jobs, jobsLoading, jobsError, updateJobStatus } = useWorkspace();
  if (jobsLoading)
    return <FeedbackMessage role="status">Loading jobs…</FeedbackMessage>;
  if (jobsError)
    return <FeedbackMessage role="alert">{jobsError}</FeedbackMessage>;
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
  return <ScreeningRankingPage />;
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
  if (jobsLoading)
    return <FeedbackMessage role="status">Loading job…</FeedbackMessage>;
  if (jobsError)
    return <FeedbackMessage role="alert">{jobsError}</FeedbackMessage>;
  const job = jobs.find((record) => record.id === jobId);
  if (!job)
    return <FeedbackMessage role="alert">Job not found.</FeedbackMessage>;
  return (
    <NewJobPage
      key={job.id}
      initialJob={job}
      onCreate={async (changes) => {
        // Saving details preserves the current published/archived status.
        const details: JobChanges = { ...changes };
        delete details.status;
        await editJob(job.id, details);
      }}
    />
  );
}

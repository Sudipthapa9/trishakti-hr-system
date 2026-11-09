/**
 * Shares prototype recruitment records and mutation callbacks between route adapters and the workspace layout.
 */
import type { JobChanges } from "@/data/jobs-api";
import { createContext, useContext } from "react";
import type { Candidate, CandidateStage, Job, JobStatus } from "@/types/hr";

// Define WorkspaceData so callers and implementations agree on the required data shape.
export type WorkspaceData = {
  jobs: Job[];
  candidates: Candidate[];
  updateJobStatus: (jobId: string, status: JobStatus) => Promise<void>;
  editJob: (jobId: string, changes: JobChanges) => Promise<void>;
  createJob: (job: Omit<Job, "id" | "applicants">) => Promise<void>;
  jobsLoading: boolean;
  jobsError: string | null;
  updateCandidateStage: (candidateId: string, stage: CandidateStage) => void;
};
// Use null as the missing-provider sentinel; the companion hook reports incorrect usage.
export const WorkspaceContext = createContext<WorkspaceData | null>(null);
// Read shared recruitment state and require the workspace provider.
export function useWorkspace() {
  const data = useContext(WorkspaceContext);
  if (!data)
    throw new Error("useWorkspace must be used inside WorkspaceLayout");
  return data;
}

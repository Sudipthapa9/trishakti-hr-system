import { hrRequest } from "@/data/hr-api";

export type PipelineApplication = {
  id: string;
  candidateId: string;
  jobId: string;
  fullName: string;
  jobTitle: string;
  stage: string;
  createdAt: string;
};

export type PipelinePage = {
  applications: PipelineApplication[];
  hasMore: boolean;
};

// Keep multipart boundaries with the browser; hrRequest adds the staff token.
export function addPipelineCandidate(data: FormData): Promise<{
  application: { reference: string; candidateName: string; jobId: string };
}> {
  return hrRequest("applications/internal", { method: "POST", body: data });
}

export async function requestPipelineApplications(
  jobId: string,
  page = 1,
  signal?: AbortSignal,
): Promise<PipelinePage> {
  if (!jobId) {
    throw new Error("Select a job first.");
  }

  const query = new URLSearchParams({
    jobId,
    page: String(page),
  });

  return hrRequest(`applications?${query.toString()}`, {
    signal,
  });
}

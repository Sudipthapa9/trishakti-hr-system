import { hrRequest } from "@/data/hr-api";
import type { ApplicationStage } from "@/data/application-stages";
export type ApplicationRecord = {
  id: string;
  candidateId: string;
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  stage: ApplicationStage;
  coverLetter: string;
  createdAt: string;
  hasResume: boolean;
  resumeName: string | null;
};
export function requestApplications(
  filters: { page: number; jobId: string; stage: string; q: string },
  signal?: AbortSignal,
): Promise<{ applications: ApplicationRecord[]; hasMore: boolean }> {
  const query = new URLSearchParams({ page: String(filters.page) });
  for (const key of ["jobId", "stage", "q"] as const)
    if (filters[key]) query.set(key, filters[key]);
  return hrRequest("applications?" + query.toString(), { signal });
}
export async function downloadApplicationResume(
  id: string,
  signal?: AbortSignal,
): Promise<Blob> {
  return hrRequest(
    "applications/" + encodeURIComponent(id) + "/resume",
    { signal },
    true,
  );
}

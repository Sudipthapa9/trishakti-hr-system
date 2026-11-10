import keycloak from "@/keycloak";
import type { ApplicationStage } from "./application-stages";

export type CandidateRecord = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  applicationCount: number;
};

export type CandidateList = {
  candidates: CandidateRecord[];
  page: number;
  hasMore: boolean;
};

export type CandidateApplication = {
  id: string;
  jobId: string;
  jobTitle: string;
  jobStatus: string;
  stage: ApplicationStage;
  fullName: string;
  email: string;
  phone: string;
  coverLetter: string;
  createdAt: string;
  hasResume: boolean;
};

export type CandidateDetail = Omit<CandidateRecord, "applicationCount"> & {
  applications: CandidateApplication[];
};

export async function requestCandidates(
  search: string,
  page: number,
  signal: AbortSignal,
): Promise<CandidateList> {
  const query = new URLSearchParams({ search, page: String(page) });
  return candidateRequest("?" + query, signal);
}

export async function requestCandidate(id: string, signal: AbortSignal): Promise<{ candidate: CandidateDetail }> {
  return candidateRequest("/" + encodeURIComponent(id), signal);
}

async function candidateRequest(path: string, signal: AbortSignal) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/candidates" + path, {
    signal,
    headers: { Authorization: `Bearer ${keycloak.token}` },
  });
  if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to view candidates.");
  if (response.status === 404) throw new Error("Candidate not found.");
  if (response.status === 400) throw new Error("Invalid candidate request.");
  if (!response.ok) throw new Error("Could not load candidates. Please try again.");
  return response.json();
}

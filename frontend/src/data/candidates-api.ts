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

export type CandidateProfile = Pick<CandidateRecord, "id" | "fullName" | "email" | "phone">;

export class ProfileConflictError extends Error {
  candidate: CandidateProfile;
  constructor(message: string, candidate: CandidateProfile) {
    super(message);
    this.candidate = candidate;
  }
}

export async function saveCandidateProfile(
  candidate: CandidateProfile,
  fullName: string,
  phone: string,
): Promise<{ candidate: CandidateProfile }> {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/candidates/" + encodeURIComponent(candidate.id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: JSON.stringify({
      fullName, phone,
      expectedFullName: candidate.fullName,
      expectedPhone: candidate.phone,
    }),
  });
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to edit profiles.");
  const data = await response.json();
  if (response.status === 409) throw new ProfileConflictError(data.error, data.candidate);
  if (response.status === 400) throw new Error("Enter a valid name and phone number.");
  if (!response.ok) throw new Error(data.error || "Could not save this profile.");
  return data;
}

import keycloak from "@/keycloak";
import type { Job } from "@/types/hr";

type SavedJob = Omit<Job, "applicants" | "closingDate" | "description"> & {
  closingDate: string | null;
  description: string | null;
  applicants?: number;
};

function toJob(record: SavedJob): Job {
  return {
    ...record,
    applicants: record.applicants ?? 0,
    closingDate: record.closingDate ?? "",
    description: record.description ?? undefined,
  };
}

async function request(options: RequestInit, path = "") {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/jobs" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${keycloak.token}`,
    },
  });
  if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to manage jobs.");
  if (response.status === 400) throw new Error("Check all required fields and their lengths.");
  if (response.status === 404) throw new Error("This job is no longer available. Refresh the list.");
  if (!response.ok) throw new Error("The jobs service could not complete the request.");
  return response.json();
}

export type JobChanges = Partial<Pick<Job, "title" | "department" | "location" | "employmentType" | "description" | "status" | "closingDate" | "responsibilities" | "requiredSkills" | "preferredSkills" | "vacancies" | "shortlistMultiplier">>;

export async function updateJob(id: string, changes: JobChanges): Promise<Job> {
  const data: { job: SavedJob } = await request({
    method: "PATCH",
    body: JSON.stringify(changes),
  }, "/" + encodeURIComponent(id));
  return toJob(data.job);
}

export async function requestJobs(signal: AbortSignal): Promise<Job[]> {
  const data: { jobs: SavedJob[] } = await request({ signal });
  return data.jobs.map(toJob);
}

export async function saveDraft(job: Omit<Job, "id" | "applicants">): Promise<Job> {
  const {
    title, department, location, employmentType, description, closingDate,
    responsibilities, requiredSkills, preferredSkills, vacancies, shortlistMultiplier,
  } = job;
  const data: { job: SavedJob } = await request({
    method: "POST",
    body: JSON.stringify({
      title, department, location, employmentType, description, closingDate,
      responsibilities, requiredSkills, preferredSkills, vacancies, shortlistMultiplier,
    }),
  });
  return toJob(data.job);
}

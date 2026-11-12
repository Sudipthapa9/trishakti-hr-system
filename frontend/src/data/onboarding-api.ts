import keycloak from "@/keycloak";
export type Checklist = { documents: boolean; payroll: boolean; accounts: boolean; orientation: boolean };
export type OnboardingRecord = { id: string; offerId: string; candidateName: string; email: string; position: string; joiningDate: string; department: string; location: string; version: number; checklist: Checklist; completedAt: string | null; completedBy: string | null; employeeId: string | null };
async function request(path: string, options: RequestInit = {}) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const response = await fetch((import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "") + "/api/onboarding" + path, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${keycloak.token}` } });
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to manage onboarding.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not complete the onboarding request.");
  return data;
}
export function startOnboarding(offerId: string): Promise<{ id: string }> { return request("", { method: "POST", body: JSON.stringify({ offerId }) }); }
export function listOnboarding(page: number, signal: AbortSignal): Promise<{ records: OnboardingRecord[]; hasMore: boolean }> { return request("?page=" + page, { signal }); }
export function getOnboarding(id: string, signal: AbortSignal): Promise<{ record: OnboardingRecord }> { return request("/" + encodeURIComponent(id), { signal }); }
export function saveChecklist(record: OnboardingRecord, checklist: Checklist): Promise<{ record: OnboardingRecord }> { return request("/" + encodeURIComponent(record.id), { method: "PATCH", body: JSON.stringify({ expectedVersion: record.version, checklist }) }); }
export function completeOnboarding(record: OnboardingRecord): Promise<{ employeeId: string }> {
  return request("/" + encodeURIComponent(record.id) + "/complete", { method: "POST", body: JSON.stringify({ expectedVersion: record.version }) });
}

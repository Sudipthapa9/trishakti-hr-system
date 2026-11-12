import keycloak from "@/keycloak";
export type EmployeeRecord = {
  id: string; onboardingId: string; candidateId: string; applicationId: string;
  fullName: string; email: string; phone: string; position: string;
  department: string; location: string; joiningDate: string; createdAt: string; createdBy: string;
  version: number; updatedAt: string; updatedBy: string | null;
  emergencyName: string; emergencyRelationship: string; emergencyPhone: string;
};
async function request(path: string, signal: AbortSignal) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const response = await fetch((import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "") + "/api/employees" + path, {
    signal, headers: { Authorization: `Bearer ${keycloak.token}` },
  });
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to view employees.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load employee records.");
  return data;
}
export function listEmployees(page: number, signal: AbortSignal): Promise<{ employees: EmployeeRecord[]; hasMore: boolean }> {
  return request("?page=" + page, signal);
}
export function getEmployee(id: string, signal: AbortSignal): Promise<{ employee: EmployeeRecord }> {
  return request("/" + encodeURIComponent(id), signal);
}

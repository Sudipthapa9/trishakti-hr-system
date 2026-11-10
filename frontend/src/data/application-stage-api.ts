import keycloak from "@/keycloak";
import type { ApplicationStage } from "./application-stages";

export class StageConflictError extends Error {
  currentStage: ApplicationStage;

  constructor(message: string, currentStage: ApplicationStage) {
    super(message);
    this.currentStage = currentStage;
  }
}

export async function saveApplicationStage(
  id: string,
  stage: ApplicationStage,
  expectedStage: ApplicationStage,
): Promise<{ application: { id: string; stage: ApplicationStage; updatedAt: string } }> {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/applications/" + encodeURIComponent(id) + "/stage", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${keycloak.token}`,
    },
    body: JSON.stringify({ stage, expectedStage }),
  });
  if (response.status === 401) throw new Error("Your session expired. Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to update stages.");
  const data = await response.json();
  if (response.status === 409) throw new StageConflictError(data.error, data.currentStage);
  if (!response.ok) throw new Error(data.error || "Could not save this stage. Please try again.");
  return data;
}

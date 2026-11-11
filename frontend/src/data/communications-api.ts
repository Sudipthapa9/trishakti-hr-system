import keycloak from "@/keycloak";

export type MessageRecord = {
  id: string; applicationId: string; recipientEmail: string; recipientName: string;
  offerId?: string | null;
  subject: string; body: string;
  status: "Draft" | "Sending" | "Accepted" | "Failed" | "Unknown";
  version: number; providerMessageId: string | null; lastError: string | null;
  createdAt: string; updatedAt: string;
};

export class CommunicationError extends Error {
  record?: MessageRecord;
  constructor(message: string, record?: MessageRecord) {
    super(message);
    this.record = record;
  }
}

export async function communicationRequest(path: string, options: RequestInit = {}) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${keycloak.token}` },
  });
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required for communication.");
  const data = await response.json();
  if (!response.ok) throw new CommunicationError(data.error || "Could not complete this request.", data.message);
  return data;
}

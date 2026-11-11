import keycloak from "@/keycloak";

export type OfferFields = {
  position: string; currency: string; annualSalary: string; signOnBonus: string;
  joiningDate: string; expiryDate: string; benefits: string;
};
export type OfferRecord = OfferFields & {
  id: string; applicationId: string; status: string; version: number;
  candidateName?: string; candidateEmail?: string; jobTitle?: string;
  createdAt: string; updatedAt: string;
  sendStatus: "NotSent" | "Sending" | "Accepted" | "Failed" | "Unknown";
  delivery: { id: string; status: string; lastError: string | null; providerMessageId: string | null } | null;
};
export type OfferRecipient = { id: string; fullName: string; email: string; jobTitle: string };

export class OfferRequestError extends Error {
  offer?: OfferRecord;
  constructor(message: string, offer?: OfferRecord) {
    super(message);
    this.offer = offer;
  }
}

async function request(path: string, options: RequestInit = {}) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const base = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const response = await fetch(base.replace(/\/$/, "") + "/api/" + path, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${keycloak.token}` },
  });
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required to manage offers.");
  const data = await response.json();
  if (response.status === 400) throw new Error("Check amounts, currency and dates. Expiry must be on or before joining.");
  if (!response.ok) throw new OfferRequestError(data.error || "Could not complete the offer request.", data.offer);
  return data;
}

export async function sendOffer(id: string, expectedVersion: number): Promise<{ offer: OfferRecord }> {
  return request("offers/" + encodeURIComponent(id) + "/send", {
    method: "POST", body: JSON.stringify({ expectedVersion }),
  });
}

export async function listOffers(page: number, signal: AbortSignal): Promise<{ offers: OfferRecord[]; hasMore: boolean }> {
  return request("offers?page=" + page, { signal });
}
export async function getOffer(id: string, signal: AbortSignal): Promise<{ offer: OfferRecord }> {
  return request("offers/" + encodeURIComponent(id), { signal });
}
export async function offerRecipients(page: number, signal: AbortSignal): Promise<{ applications: OfferRecipient[]; hasMore: boolean }> {
  return request("applications?page=" + page, { signal });
}
export async function saveOffer(fields: OfferFields, id: string, applicationId: string, version?: number): Promise<{ offer: OfferRecord }> {
  return version === undefined
    ? request("offers", { method: "POST", body: JSON.stringify({ ...fields, id, applicationId }) })
    : request("offers/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify({ ...fields, expectedVersion: version }) });
}

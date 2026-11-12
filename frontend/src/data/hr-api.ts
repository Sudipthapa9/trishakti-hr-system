import keycloak from "@/keycloak";

// Shared authenticated requests for the remaining HR workspace modules.
export async function hrRequest(
  path: string,
  options: RequestInit = {},
  binary = false,
) {
  if (!keycloak.authenticated) throw new Error("Please sign in again.");
  await keycloak.updateToken(30);
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${keycloak.token}`);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(
    (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(
      /\/$/,
      "",
    ) +
      "/api/" +
      path,
    { ...options, headers },
  );
  if (response.status === 401) throw new Error("Please sign in again.");
  if (response.status === 403) throw new Error("An HR role is required.");
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(
      data.error === "Validation failed"
        ? "Check the required fields and their formats."
        : data.error || "Could not complete this request.",
    );
  }
  return binary ? response.blob() : response.json();
}

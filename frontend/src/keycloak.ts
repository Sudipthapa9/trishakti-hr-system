/**
 * Creates the public-browser Keycloak adapter using public Vite configuration; credentials belong to Keycloak.
 */
// src/keycloak.ts
import Keycloak from "keycloak-js";

// Keep module-level configuration outside rendering so it is shared between component instances.
const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8080",
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "trishakti-hr",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "trishakti-hr-web",
});

export default keycloak;

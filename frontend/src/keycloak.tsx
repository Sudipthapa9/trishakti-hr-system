// src/keycloak.ts
import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "trishakti-hr",
  clientId: "trishakti-hr-web",
});

export default keycloak;
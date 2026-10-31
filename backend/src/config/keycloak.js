/**
 * Derives the trusted issuer and public signing-key endpoint from server environment configuration.
 */
// Read server configuration; do not hard-code deployment credentials.
const KEYCLOAK_URL = process.env.KEYCLOAK_URL;
const REALM = process.env.KEYCLOAK_REALM;

// The issuer identifies the trusted realm; JWKS exposes its public verification keys.
module.exports = {
  jwksUri: `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`,
  issuer: `${KEYCLOAK_URL}/realms/${REALM}`,
};

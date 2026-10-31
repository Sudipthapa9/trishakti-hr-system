/**
 * Verifies RS256 JWTs against the configured Keycloak issuer and cached JWKS signing keys.
 */
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { jwksUri, issuer } = require("../config/keycloak");

// Reject tokens from other issuers or algorithms before trusting their claims.
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri,
    // Reuse public signing keys and limit key-endpoint requests.
    cache: true,
    rateLimit: true,
  }),
  issuer,
  algorithms: ["RS256"],
});

module.exports = checkJwt;

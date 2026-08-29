const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const { jwksUri, issuer } = require("../config/keycloak");

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    jwksUri,
    cache: true,
    rateLimit: true,
  }),
  issuer,
  algorithms: ["RS256"],
});

module.exports = checkJwt;
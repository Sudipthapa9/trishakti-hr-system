/**
 * Enforces application realm-role checks after successful JWT verification.
 */
// Create middleware that accepts any listed realm role after JWT authentication has populated req.auth.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // Read realm roles only from the payload already validated by JWT middleware.
    const roles = req.auth?.realm_access?.roles || [];
    const hasRole = allowedRoles.some((r) => roles.includes(r));
    // A valid identity without an allowed role receives 403, not 401.
    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden" });
    }
    // Continue to the business handler only after the role check succeeds.
    next();
  };
}

module.exports = requireRole;

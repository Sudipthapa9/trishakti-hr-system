function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const roles = req.auth?.realm_access?.roles || [];
    const hasRole = allowedRoles.some(r => roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

module.exports = requireRole;
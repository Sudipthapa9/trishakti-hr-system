/**
 * Provides small protected endpoints for verifying the authentication and realm-role middleware.
 */
const express = require("express");
const checkJwt = require("../middleware/auth");
const requireRole = require("../middleware/rbac");

const router = express.Router();

// Authentication runs before authorization; these checks require the exact listed role.
router.get("/hr-only", checkJwt, requireRole("hr"), (req, res) => {
  res.json({ message: "Welcome HR" });
});

// Use a separate role endpoint to verify that forbidden access returns 403.
router.get("/manager-only", checkJwt, requireRole("manager"), (req, res) => {
  res.json({ message: "Welcome Manager" });
});

module.exports = router;

const express = require("express");
const checkJwt = require("../middleware/auth");
const requireRole = require("../middleware/rbac");

const router = express.Router();

router.get("/hr-only", checkJwt, requireRole("hr"), (req, res) => {
  res.json({ message: "Welcome HR" });
});

router.get("/manager-only", checkJwt, requireRole("manager"), (req, res) => {
  res.json({ message: "Welcome Manager" });
});

module.exports = router;
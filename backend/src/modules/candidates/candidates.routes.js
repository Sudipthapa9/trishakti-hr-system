const express = require("express");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const { listCandidates } = require("./candidates.controller");

const router = express.Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/", checkJwt, requireRole("hr", "hr-head"), listCandidates);

module.exports = router;

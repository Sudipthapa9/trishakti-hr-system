const express = require("express");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const { listCandidates, getCandidate } = require("./candidates.controller");

const router = express.Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/", checkJwt, requireRole("hr", "hr-head"), listCandidates);
router.get("/:id", checkJwt, requireRole("hr", "hr-head"), getCandidate);

module.exports = router;

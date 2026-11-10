const express = require("express");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const { listCandidates, getCandidate, updateCandidate } = require("./candidates.controller");
const validate = require("../../middleware/validate");
const { updateCandidateSchema } = require("./candidates.schema");

const router = express.Router();

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.get("/", checkJwt, requireRole("hr", "hr-head"), listCandidates);
router.get("/:id", checkJwt, requireRole("hr", "hr-head"), getCandidate);
router.patch("/:id", checkJwt, requireRole("hr", "hr-head"), validate(updateCandidateSchema), updateCandidate);

module.exports = router;

const express = require("express");
const {
  getJobs,
  getPublicJobs,
  createJob,
} = require("./jobs.controller");

const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const { createJobSchema } = require("./jobs.schema");

const router = express.Router();

// Public listings include only open jobs.
router.get("/public", getPublicJobs);

// HR staff can see drafts and archived jobs as well.
router.get("/", checkJwt, requireRole("hr", "hr-head"), getJobs);

// Authenticate, check the role, validate input, then create a job.
router.post(
  "/",
  checkJwt,
  requireRole("hr", "hr-head"),
  validate(createJobSchema),
  createJob
);

module.exports = router;

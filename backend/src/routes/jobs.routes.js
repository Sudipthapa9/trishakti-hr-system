const express = require("express");
const {
  getJobs,
  createJob,
} = require("../controllers/jobs.controller");

const checkJwt = require("../middleware/auth");
const requireRole = require("../middleware/rbac");
const validate = require("../middleware/validate");
const { createJobSchema } = require("../validators/jobs.schema");

const router = express.Router();

// Read jobs.
router.get("/", getJobs);

// Authenticate, check the role, validate input, then create a job.
router.post(
  "/",
  checkJwt,
  requireRole("hr", "hr-head"),
  validate(createJobSchema),
  createJob
);

module.exports = router;
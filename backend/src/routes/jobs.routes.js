const express = require("express");
// Import the getJobs controller function to handle requests to the jobs API.
const { getJobs } = require("../controllers/jobs.controller");
// Create a new router instance to define routes for the jobs API.
const router = express.Router();
// Define a route to handle GET requests to the root path of the jobs API.
router.get("/", getJobs);

module.exports = router;
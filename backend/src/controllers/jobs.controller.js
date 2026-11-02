// Handle requests to list jobs.
function getJobs(req, res) {
  res.json({
    jobs: [
      { id: "job-1", title: "HR Assistant", status: "Open" },
    ],
  });
}

// Make this function available to other files.
module.exports = { getJobs };
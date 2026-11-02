const jobsRoutes = require("./routes/jobs.routes");
/**
 * Creates the Express pipeline: request middleware, protected test routes, then the final error handler.
 */
const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/test.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
// Allow browser requests through the current development CORS policy.
app.use(cors());
// Parse JSON before validation and route handlers inspect req.body.
app.use(express.json());

// Mount the protected verification routes under one API prefix.
app.use("/api/test", testRoutes);

// Mount the jobs routes under one API prefix.
app.use("/api/jobs", jobsRoutes);
// Register error handling last so upstream middleware errors reach it.
app.use(errorHandler);

module.exports = app;

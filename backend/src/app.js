const jobsRoutes = require("./modules/jobs/jobs.routes");
const applicationsRoutes = require("./modules/applications/applications.routes");
const candidatesRoutes = require("./modules/candidates/candidates.routes");
const communicationsRoutes = require("./modules/communications/communications.routes");
const offersRoutes = require("./modules/offers/offers.routes");
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
app.use("/api/applications", applicationsRoutes);
app.use("/api/candidates", candidatesRoutes);
app.use("/api/communications", communicationsRoutes);
app.use("/api/offers", offersRoutes);
app.use("/api/onboarding", require("./modules/onboarding/onboarding.routes"));
app.use("/api/employees", require("./modules/employees/employees.routes"));
app.use("/api/interviews", require("./modules/interviews/interviews.routes"));
app.use("/api/dashboard", require("./modules/dashboard/dashboard.routes"));
app.use("/api/onboarding/:id/documents", require("./modules/documents/documents.routes"));
// Register error handling last so upstream middleware errors reach it.
app.use(errorHandler);

module.exports = app;

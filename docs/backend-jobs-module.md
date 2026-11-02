# Backend jobs module

Last updated: 2 November 2026

Working branch: `codex/backend-jobs-module`

## Purpose and current status

Build the jobs API one step at a time while learning Express and PostgreSQL. The current milestone is a working `GET /api/jobs` endpoint with a separate route and controller. It returns hardcoded sample data. Database integration is planned, not implemented.

## Existing backend foundation

- `backend/src/server.js` loads environment configuration and starts Express on the configured port (4000 by default).
- `backend/src/app.js` creates the app, enables CORS and JSON parsing, mounts routers, and registers the error handler.
- `backend/src/config/keycloak.js` derives the trusted issuer and signing-key URL from environment configuration.
- `backend/src/middleware/auth.js` verifies Keycloak JWTs.
- `backend/src/middleware/rbac.js` checks allowed realm roles after authentication.
- `backend/src/middleware/validate.js` validates request bodies with a supplied schema.
- `backend/src/middleware/errorHandler.js` returns authentication errors as 401 and unexpected errors as 500.
- `backend/src/routes/test.routes.js` provides protected endpoints for checking HR/manager access.

These foundations existed before this jobs milestone. Middleware applies only where it is registered; the new jobs endpoint is currently public and returns sample data only.

## Completed work — 2 November 2026

### Added the jobs router

Created `backend/src/routes/jobs.routes.js` and mounted it in `app.js`:

```js
app.use("/api/jobs", jobsRoutes);
```

Inside the router:

```js
router.get("/", getJobs);
```

The mount prefix and router path combine into `GET /api/jobs`. Grouping jobs routes together keeps URL definitions easy to find.

### Extracted the controller

Created `backend/src/controllers/jobs.controller.js`:

```js
function getJobs(req, res) {
  res.json({
    jobs: [
      { id: "job-1", title: "HR Assistant", status: "Open" },
    ],
  });
}

module.exports = { getJobs };
```

The router imports `getJobs` and passes the function to Express without calling it. Express invokes it when a request matches. This separates URL registration from response handling and provides a place to integrate database reads later.

### Fixed middleware order and exports

The jobs router is registered before `app.use(errorHandler)` so errors forwarded by the router can reach the shared handler.

During implementation, controller code was accidentally placed in the router file. Exporting `{ getJobs }` there caused `app.use()` to receive an object instead of a router and fail with `argument handler must be a function`. The corrected router exports `router`; the controller exports `{ getJobs }`.

### Learned how to start the backend

From the repository root:

```powershell
npm --prefix backend run dev
```

From inside the backend folder:

```powershell
npm run dev
```

Using `--prefix backend` while already inside that folder incorrectly searches for `backend/backend/package.json`. Nodemon restarts the server after saved source changes.

## Request flow

```text
Browser GET /api/jobs
  -> app.js matches /api/jobs
  -> jobs.routes.js matches GET /
  -> getJobs controller sends JSON
```

Expected response:

```json
{"jobs":[{"id":"job-1","title":"HR Assistant","status":"Open"}]}
```

## Verification

The user started the backend and confirmed the expected JSON response in the browser. The merge preparation also checks this endpoint using a temporary local Express listener and validates the Git diff. Backend `npm test` is still a placeholder; no automated backend test suite is claimed.

## Planned next steps

1. Inspect the existing PostgreSQL/Compose setup and identify the application database separately from Keycloak storage.
2. Compare proposed database columns with the frontend Job type.
3. Create a versioned SQL migration for the jobs table and separate sample seed data.
4. Install/configure `pg` and a shared connection pool using environment configuration.
5. Add a repository for parameterized SQL queries and replace the controller's hardcoded array with database records.
6. Add single-job reads, validated creation and updates, and role protection for HR operations.
7. Connect the frontend with loading, empty, and error states. Public careers should receive only public fields from published jobs.

No database connection, migration, persistence, or frontend API integration has been added in this milestone. The existing frontend public-careers shortcut is outside this backend module commit.

## How to maintain this document

For each completed backend milestone, append a dated entry with what changed, the affected files, a short code example where useful, why the change was needed, and the checks actually performed. Update current status and remaining work at the same time. Record implementation as completed only after it exists and has been checked. Keep credentials and real applicant data out of examples.

require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const { listCandidates, getCandidate } = require("../src/modules/candidates/candidates.controller");
const { updateApplicationStage } = require("../src/modules/applications/applications.controller");
const { updateStageSchema } = require("../src/modules/applications/applications.schema");
const requireRole = require("../src/middleware/rbac");
const app = require("../src/app");

test("candidate list search, pagination, counts and access checks", {
  skip: process.env.RUN_DATABASE_TESTS !== "1",
  timeout: 60000,
}, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  pool.query = client.query.bind(client);
  const prefix = "verification-" + randomUUID();
  async function call(query) {
    let status = 200;
    let body;
    const response = {
      status(value) { status = value; return this; },
      json(value) { body = value; return this; },
    };
    await listCandidates({ query }, response, (error) => { throw error; });
    return { status, body };
  }
  async function detail(id) {
    let status = 200;
    let body;
    const response = {
      status(value) { status = value; return this; },
      json(value) { body = value; return this; },
    };
    await getCandidate({ params: { id } }, response, (error) => { throw error; });
    return { status, body };
  }
  async function changeStage(id, stage, expectedStage) {
    let status = 200;
    let body;
    const response = {
      status(value) { status = value; return this; },
      json(value) { body = value; return this; },
    };
    await updateApplicationStage({ params: { id }, body: { stage, expectedStage } }, response,
      (error) => { throw error; });
    return { status, body };
  }
  let server;
  try {
    await client.query("BEGIN");
    for (let index = 0; index < 21; index += 1) {
      await client.query(`
        INSERT INTO public.candidates (full_name, email, phone)
        VALUES ($1, $2, $3)
      `, [prefix + "-" + index, prefix + "-" + index + "@example.invalid", "+977 0000000000"]);
    }
    const first = await call({ search: prefix, page: "1" });
    assert.equal(first.status, 200);
    assert.equal(first.body.candidates.length, 20);
    assert.equal(first.body.hasMore, true);
    const second = await call({ search: prefix, page: "2" });
    assert.equal(second.body.candidates.length, 1);
    assert.equal(second.body.hasMore, false);
    assert(!first.body.candidates.some((candidate) => candidate.id === second.body.candidates[0].id));
    const selected = first.body.candidates[0];
    assert.equal(selected.applicationCount, 0);
    assert.deepEqual((await detail(selected.id)).body.candidate.applications, []);
    const job = (await client.query(`
      INSERT INTO public.jobs(title,department,location,employment_type)
      VALUES('Verification','HR','Hetauda','Full-time') RETURNING id
    `)).rows[0];
    await client.query(`
      INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone)
      VALUES($1,$2,$3,$4,$5)
    `, [selected.id, job.id, selected.fullName, selected.email, selected.phone]);
    const exact = await call({ search: selected.email.toUpperCase() });
    assert.equal(exact.body.candidates.length, 1);
    assert.equal(exact.body.candidates[0].applicationCount, 1);
    const profile = await detail(selected.id);
    assert.equal(profile.status, 200);
    assert.equal(profile.body.candidate.id, selected.id);
    assert.equal(profile.body.candidate.applications.length, 1);
    assert.equal(profile.body.candidate.applications[0].stage, "Review");
    assert.equal(profile.body.candidate.applications[0].jobTitle, "Verification");
    assert.equal(profile.body.candidate.applications[0].hasResume, false);
    assert.equal("content" in profile.body.candidate.applications[0], false);
    const applicationId = profile.body.candidate.applications[0].id;
    const secondJob = (await client.query(`
      INSERT INTO public.jobs(title,department,location,employment_type)
      VALUES('Second verification job','HR','Hetauda','Full-time') RETURNING id
    `)).rows[0];
    await client.query(`
      INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone)
      VALUES($1,$2,$3,$4,$5)
    `, [selected.id, secondJob.id, selected.fullName, selected.email, selected.phone]);
    assert.equal(updateStageSchema.safeParse({ stage: "Invalid", expectedStage: "Review" }).success, false);
    assert.equal(updateStageSchema.safeParse({ stage: "Interview" }).success, false);
    const changed = await changeStage(applicationId, "Interview", "Review");
    assert.equal(changed.status, 200);
    assert.equal(changed.body.application.stage, "Interview");
    assert(changed.body.application.updatedAt);
    const refreshed = (await detail(selected.id)).body.candidate;
    assert.equal(refreshed.applications.find((entry) => entry.id === applicationId).stage, "Interview");
    assert.equal(refreshed.applications.find((entry) => entry.jobId === secondJob.id).stage, "Review");
    assert.equal((await changeStage(applicationId, "Interview", "Review")).status, 200);
    const stale = await changeStage(applicationId, "Offer", "Review");
    assert.equal(stale.status, 409);
    assert.equal(stale.body.currentStage, "Interview");
    assert.equal((await changeStage("invalid", "Offer", "Interview")).status, 400);
    assert.equal((await changeStage("00000000-0000-4000-8000-000000000000", "Offer", "Interview")).status, 404);
    assert.equal((await detail("invalid")).status, 400);
    assert.equal((await detail("00000000-0000-4000-8000-000000000000")).status, 404);
    const injection = await call({ search: "' OR 1=1 -- " + prefix });
    assert.equal(injection.body.candidates.length, 0);
    assert.equal((await call({ page: "0" })).status, 400);
    assert.equal((await call({ page: "1.5" })).status, 400);
    assert.equal((await call({ search: ["one", "two"] })).status, 400);
    assert.equal((await call({ search: "a".repeat(201) })).status, 400);
    let denied;
    const response = { status(code) { denied = code; return this; }, json() {} };
    requireRole("hr", "hr-head")(
      { auth: { realm_access: { roles: ["manager"] } } },
      response, () => assert.fail("Manager must not pass the HR role check"),
    );
    assert.equal(denied, 403);
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const unauthenticated = await fetch("http://127.0.0.1:" + server.address().port + "/api/candidates");
    assert.equal(unauthenticated.status, 401);
    assert.equal(unauthenticated.headers.get("cache-control"), "no-store");
    const detailAccess = await fetch("http://127.0.0.1:" + server.address().port + "/api/candidates/" + selected.id);
    assert.equal(detailAccess.status, 401);
    const stageAccess = await fetch("http://127.0.0.1:" + server.address().port + "/api/applications/" + applicationId + "/stage", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: "Offer", expectedStage: "Interview" }),
    });
    assert.equal(stageAccess.status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await client.query("ROLLBACK");
    pool.query = originalQuery;
    client.release();
    await pool.end();
  }
});

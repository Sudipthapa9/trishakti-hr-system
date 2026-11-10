// Opt-in database integration test. Every generated record is removed in finally.
require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const app = require("../src/app");
const { listApplications, downloadResume } = require("../src/modules/applications/applications.controller");
const { validateResume } = require("../src/modules/applications/resume-validation");
const { getJobs, createJob } = require("../src/modules/jobs/jobs.controller");

test("application submission, retries, private CVs and rollback", {
  skip: process.env.RUN_DATABASE_TESTS !== "1",
  timeout: 120000,
}, async () => {
  const runId = randomUUID();
  const email = "verification-" + runId + "@example.invalid";
  const failedEmail = "rollback-" + runId + "@example.invalid";
  const pdf = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF");
  const jobs = [];
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port + "/api/applications";
  async function makeJob(status = "Open") {
    const saved = await callHandler(createJob, { body: {
      title: "Application verification", department: "HR",
      location: "Hetauda", employmentType: "Full-time",
      description: "Temporary integration test",
    } });
    assert.equal(saved.status, 201);
    const result = { rows: [{ id: saved.body.job.id }] };
    await pool.query("UPDATE public.jobs SET status=$1 WHERE id=$2", [status, saved.body.job.id]);
    jobs.push(result.rows[0].id);
    return result.rows[0].id;
  }
  function form(jobId, requestId, overrides = {}) {
    const data = new FormData();
    const fields = { jobId, requestId, fullName: "Verification Person", email, phone: "+977 0000000000", coverLetter: "Verification", ...overrides };
    for (const [name, value] of Object.entries(fields)) data.set(name, value);
    data.set("resume", new Blob([pdf], { type: "application/pdf" }), "resume.pdf");
    return data;
  }
  function send(data) {
    return fetch(base, { method: "POST", body: data });
  }
  async function callHandler(handler, request) {
    let status = 200;
    let body;
    const headers = {};
    const response = {
      status(value) { status = value; return this; },
      json(value) { body = value; return this; },
      set(name, value) { headers[name] = value; return this; },
      attachment(value) { headers.filename = value; return this; },
      type(value) { headers.type = value; return this; },
      send(value) { body = value; return this; },
    };
    await handler(request, response, (error) => { throw error; });
    return { status, body, headers };
  }
  try {
    const jobId = await makeJob();
    const requestId = randomUUID();
    const first = await send(form(jobId, requestId));
    assert.equal(first.status, 201);
    assert.equal((await first.json()).application.reference, "TSH-" + requestId);
    const retry = await send(form(jobId, requestId));
    assert.equal(retry.status, 200);
    assert.equal((await retry.json()).application.reference, "TSH-" + requestId);
    assert.equal((await send(form(jobId, randomUUID()))).status, 409);
    assert.equal((await send(form(jobId, requestId, { fullName: "Changed name" }))).status, 409);
    assert.equal((await send(form(jobId, randomUUID(), { email: "bad" }))).status, 400);
    const bad = form(jobId, randomUUID());
    bad.set("resume", new Blob(["bad content"]), "resume.pdf");
    assert.equal((await send(bad)).status, 400);
    const oversize = form(jobId, randomUUID());
    oversize.set("resume", new Blob([Buffer.alloc(10 * 1024 * 1024 + 1)]), "resume.pdf");
    assert.equal((await send(oversize)).status, 413);
    await assert.rejects(() => validateResume({ originalname: "fake.docx", size: 4, buffer: Buffer.from("fake") }));
    const secondJob = await makeJob();
    const concurrentId = randomUUID();
    const concurrent = await Promise.all([
      send(form(secondJob, concurrentId, { fullName: "New submission name" })),
      send(form(secondJob, concurrentId, { fullName: "New submission name" })),
    ]);
    assert.deepEqual(concurrent.map((response) => response.status).sort(), [200, 201]);
    const candidate = await pool.query("SELECT id, full_name FROM public.candidates WHERE email=$1", [email]);
    assert.equal(candidate.rows.length, 1);
    assert.equal(candidate.rows[0].full_name, "Verification Person");
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM public.applications WHERE candidate_id=$1", [candidate.rows[0].id])).rows[0].count, 2);
    const internal = await callHandler(getJobs, {});
    assert.equal(internal.body.jobs.find((job) => job.id === jobId).applicants, 1);
    const listed = await callHandler(listApplications, { query: {} });
    assert.equal(listed.status, 200);
    const record = listed.body.applications.find((entry) => entry.id === requestId);
    assert(record && record.hasResume);
    assert.equal("content" in record, false);
    const download = await callHandler(downloadResume, { params: { id: requestId } });
    assert.deepEqual(download.body, pdf);
    assert.equal(download.headers["Cache-Control"], "no-store");
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base + "/" + requestId + "/resume")).status, 401);
    const closed = await makeJob("Draft");
    assert.equal((await send(form(closed, randomUUID()))).status, 409);
    await pool.query("UPDATE public.jobs SET closing_date=CURRENT_DATE-1 WHERE id=$1", [closed]);
    await pool.query("UPDATE public.jobs SET status='Open' WHERE id=$1", [closed]);
    assert.equal((await send(form(closed, randomUUID()))).status, 409);
    // Force the final insert to fail and confirm earlier inserts do not remain.
    const originalConnect = pool.connect.bind(pool);
    pool.connect = async () => {
      const client = await originalConnect();
      const query = client.query.bind(client);
      return {
        query(sql, values) {
          if (typeof sql === "string" && sql.includes("INSERT INTO public.application_resumes")) {
            return Promise.reject(new Error("Intentional verification failure"));
          }
          return query(sql, values);
        },
        release() { client.release(); },
      };
    };
    try {
      const failed = await send(form(jobId, randomUUID(), { email: failedEmail }));
      assert.equal(failed.status, 500);
    } finally {
      pool.connect = originalConnect;
    }
    assert.equal((await pool.query("SELECT id FROM public.candidates WHERE email=$1", [failedEmail])).rows.length, 0);
  } finally {
    await pool.query("DELETE FROM public.applications WHERE job_id=ANY($1::uuid[])", [jobs]);
    await pool.query("DELETE FROM public.candidates WHERE email=ANY($1::text[])", [[email, failedEmail]]);
    await pool.query("DELETE FROM public.jobs WHERE id=ANY($1::uuid[])", [jobs]);
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});

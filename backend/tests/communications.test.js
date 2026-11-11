require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const brevo = require("../src/services/brevo");
const handlers = require("../src/modules/communications/communications.controller");
const app = require("../src/app");

test("saved communication and duplicate-safe send states", {
  skip: process.env.RUN_DATABASE_TESTS !== "1", timeout: 60000,
}, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  const originalSend = brevo.sendTransactionalEmail;
  pool.query = client.query.bind(client);
  let calls = 0;
  // This test must never call the real provider.
  brevo.sendTransactionalEmail = async () => { calls += 1; return "verification-message-id"; };
  async function call(handler, body = {}, id = randomUUID()) {
    let status = 200, data;
    const res = { status(value) { status = value; return this; }, json(value) { data = value; return this; } };
    await handler({ body, params: { id }, query: {}, auth: { sub: "verification-hr" } }, res, (error) => { throw error; });
    return { status, body: data };
  }
  let server;
  try {
    await client.query("BEGIN");
    const email = randomUUID() + "@example.invalid";
    const candidate = (await client.query("INSERT INTO public.candidates(full_name,email,phone) VALUES('Verification',$1,'12345') RETURNING id", [email])).rows[0];
    const job = (await client.query("INSERT INTO public.jobs(title,department,location,employment_type) VALUES('Verification','HR','Hetauda','Full-time') RETURNING id")).rows[0];
    const application = (await client.query("INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone) VALUES($1,$2,'Submitted name',$3,'12345') RETURNING id", [candidate.id, job.id, email])).rows[0];
    const payload = { id: randomUUID(), applicationId: application.id, subject: "Verification subject", body: "Verification body" };
    let draft = await call(handlers.createDraft, payload);
    assert.equal(draft.status, 201);
    assert.equal(draft.body.message.recipientEmail, email);
    assert.equal(draft.body.message.recipientName, "Submitted name");
    assert.equal((await call(handlers.createDraft, payload)).status, 200);
    assert.equal((await call(handlers.createDraft, { ...payload, body: "Changed" })).status, 409);
    assert.equal(calls, 0);
    draft = await call(handlers.editDraft, { subject: "Edited", body: "Edited body", expectedVersion: 1 }, payload.id);
    assert.equal(draft.body.message.version, 2);
    assert.equal((await call(handlers.editDraft, { subject: "Stale", body: "Stale", expectedVersion: 1 }, payload.id)).status, 409);
    const results = await Promise.all([
      call(handlers.sendMessage, { expectedVersion: 2 }, payload.id),
      call(handlers.sendMessage, { expectedVersion: 2 }, payload.id),
    ]);
    assert(results.some((result) => result.status === 200));
    assert.equal(calls, 1);
    const accepted = await call(handlers.getMessage, {}, payload.id);
    assert.equal(accepted.body.message.status, "Accepted");
    assert.equal(accepted.body.message.providerMessageId, "verification-message-id");
    assert.equal((await call(handlers.sendMessage, { expectedVersion: 2 }, payload.id)).status, 200);
    assert.equal(calls, 1);
    assert.equal((await call(handlers.editDraft, { subject: "Changed", body: "Changed", expectedVersion: 3 }, payload.id)).status, 409);
    for (const outcome of ["Failed", "Unknown"]) {
      const id = randomUUID();
      await call(handlers.createDraft, { ...payload, id });
      brevo.sendTransactionalEmail = async () => { throw new brevo.BrevoSendError("Verification failure", outcome); };
      const failure = await call(handlers.sendMessage, { expectedVersion: 1 }, id);
      assert.equal(failure.status, 502);
      assert.equal(failure.body.message.status, outcome);
      if (outcome === "Unknown") assert.equal((await call(handlers.sendMessage, { expectedVersion: 2 }, id)).status, 409);
      else {
        brevo.sendTransactionalEmail = async () => "retry-accepted";
        assert.equal((await call(handlers.sendMessage, { expectedVersion: 2 }, id)).body.message.status, "Accepted");
      }
    }
    const placeholder = { ...payload, id: randomUUID(), body: "Hi {{candidate_name}}" };
    await call(handlers.createDraft, placeholder);
    assert.equal((await call(handlers.sendMessage, { expectedVersion: 1 }, placeholder.id)).status, 400);
    assert.equal(handlers.createDraftSchema.safeParse({ ...payload, subject: "Bad\r\nheader" }).success, false);
    assert.equal(handlers.sendSchema.safeParse({}).success, false);
    const history = (await call(handlers.listMessages)).body.messages;
    assert.equal(history.filter((record) => record.applicationId === application.id).length, 4);
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const base = "http://127.0.0.1:" + server.address().port + "/api/communications";
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await fetch(base + "/" + payload.id + "/send", { method: "POST" })).status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    brevo.sendTransactionalEmail = originalSend;
    await client.query("ROLLBACK");
    pool.query = originalQuery;
    client.release();
    await pool.end();
  }
});

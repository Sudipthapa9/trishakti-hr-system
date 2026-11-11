require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const handlers = require("../src/modules/offers/offers.controller");
const { createOfferSchema, updateOfferSchema } = require("../src/modules/offers/offers.schema");
const app = require("../src/app");

test("offer drafts persist and reject stale edits", {
  skip: process.env.RUN_DATABASE_TESTS !== "1", timeout: 60000,
}, async () => {
  const client = await pool.connect();
  const originalQuery = pool.query;
  pool.query = client.query.bind(client);
  let server;
  async function call(handler, body = {}, id = randomUUID()) {
    let status = 200, data;
    const res = { status(value) { status = value; return this; }, json(value) { data = value; return this; } };
    await handler({ body, params: { id }, query: {}, auth: { sub: "verification-hr" } }, res, (error) => { throw error; });
    return { status, body: data };
  }
  try {
    await client.query("BEGIN");
    const email = randomUUID() + "@example.invalid";
    const candidate = (await client.query("INSERT INTO public.candidates(full_name,email,phone) VALUES('Verification',$1,'12345') RETURNING id", [email])).rows[0];
    const job = (await client.query("INSERT INTO public.jobs(title,department,location,employment_type) VALUES('Verification job','HR','Hetauda','Full-time') RETURNING id")).rows[0];
    const application = (await client.query("INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone) VALUES($1,$2,'Submitted name',$3,'12345') RETURNING id", [candidate.id, job.id, email])).rows[0];
    const payload = {
      id: randomUUID(), applicationId: application.id, position: "HR Assistant",
      currency: "NPR", annualSalary: "600000.50", signOnBonus: "10000.25",
      joiningDate: "2030-06-01", expiryDate: "2030-05-20", benefits: "Health coverage",
    };
    assert(createOfferSchema.safeParse(payload).success);
    for (const changes of [{ annualSalary: "0" }, { annualSalary: "-1" }, { annualSalary: "1.234" }, { currency: "invalid" }, { expiryDate: "2030-07-01" }, { joiningDate: "2030-02-30" }]) {
      assert.equal(createOfferSchema.safeParse({ ...payload, ...changes }).success, false);
    }
    const created = await call(handlers.createOffer, payload);
    assert.equal(created.status, 201);
    assert.equal(created.body.offer.annualSalary, "600000.50");
    assert.equal(created.body.offer.signOnBonus, "10000.25");
    assert.equal(created.body.offer.status, "Draft");
    assert.equal(created.body.offer.expiryDate, payload.expiryDate);
    assert.equal((await call(handlers.createOffer, payload)).status, 200);
    assert.equal((await call(handlers.createOffer, { ...payload, id: randomUUID() })).status, 409);
    assert.equal((await call(handlers.createOffer, { ...payload, id: randomUUID(), applicationId: randomUUID() })).status, 404);
    const detail = await call(handlers.getOffer, {}, payload.id);
    assert.equal(detail.body.offer.candidateName, "Submitted name");
    assert.equal(detail.body.offer.candidateEmail, email);
    assert.equal(detail.body.offer.jobTitle, "Verification job");
    assert.equal((await call(handlers.listOffers)).body.offers.some((record) => record.id === payload.id), true);
    const { id, applicationId, ...fields } = payload;
    const edit = { ...fields, annualSalary: "650000", expectedVersion: 1 };
    assert(updateOfferSchema.safeParse(edit).success);
    const saved = await call(handlers.updateOffer, edit, id);
    assert.equal(saved.body.offer.version, 2);
    assert.equal(saved.body.offer.annualSalary, "650000.00");
    assert.equal((await call(handlers.updateOffer, edit, id)).status, 409);
    await client.query("UPDATE public.offers SET status='Sent' WHERE id=$1", [id]);
    assert.equal((await call(handlers.updateOffer, { ...edit, expectedVersion: 2 }, id)).status, 409);
    assert.equal((await call(handlers.getOffer, {}, randomUUID())).status, 404);
    assert.equal((await call(handlers.updateOffer, edit, randomUUID())).status, 404);
    assert.equal((await client.query("SELECT stage FROM public.applications WHERE id=$1", [applicationId])).rows[0].stage, "Review");
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const url = "http://127.0.0.1:" + server.address().port + "/api/offers";
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { method: "POST" })).status, 401);
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
    await client.query("ROLLBACK");
    pool.query = originalQuery;
    client.release();
    await pool.end();
  }
});

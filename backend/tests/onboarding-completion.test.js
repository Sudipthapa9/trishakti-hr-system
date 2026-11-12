require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const handlers = require("../src/modules/onboarding/onboarding.controller");
const employees = require("../src/modules/employees/employees.controller");
const app = require("../src/app");

async function call(handler, id, body = {}) {
  let status = 200, data;
  await handler({ params: { id }, body, query: {}, auth: { sub: "verification-hr" } }, {
    status(value) { status = value; return this; },
    json(value) { data = value; return this; },
  }, error => { throw error; });
  return { status, data };
}

test("employee endpoints and completion require authentication", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api`;
    assert.equal((await fetch(base + "/employees")).status, 401);
    assert.equal((await fetch(base + "/employees/" + randomUUID())).status, 401);
    assert.equal((await fetch(base + "/onboarding/" + randomUUID() + "/complete", { method: "POST" })).status, 401);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test("completion is atomic, repeatable and creates one employee under concurrent requests", {
  skip: process.env.RUN_DATABASE_TESTS !== "1", timeout: 60000,
}, async () => {
  const ids = { candidate: randomUUID(), job: randomUUID(), application: randomUUID(), offer: randomUUID(), onboarding: randomUUID() };
  const email = ids.candidate + "@example.invalid";
  const checklist = { documents: true, payroll: true, accounts: true, orientation: true };
  const originalConnect = pool.connect;
  let extra;
  try {
    await pool.query("INSERT INTO public.candidates(id,full_name,email,phone) VALUES($1,'Verification',$2,'123')", [ids.candidate, email]);
    await pool.query("INSERT INTO public.jobs(id,title,department,location,employment_type) VALUES($1,'Verification','HR','Hetauda','Full-time')", [ids.job]);
    await pool.query("INSERT INTO public.applications(id,candidate_id,job_id,full_name,email,phone,stage) VALUES($1,$2,$3,'Submitted name',$4,'123','Offer')", [ids.application, ids.candidate, ids.job, email]);
    await pool.query("INSERT INTO public.offers(id,application_id,position,currency,annual_salary,sign_on_bonus,joining_date,expiry_date,benefits,status,send_status,created_by) VALUES($1,$2,'HR Assistant','NPR',600000,0,'2030-06-01','2030-05-20','','Accepted','Accepted','verification-hr')", [ids.offer, ids.application]);
    await pool.query("INSERT INTO public.offer_responses(offer_id,outcome,response_date,recorded_by,recorded_name) VALUES($1,'Accepted','2030-05-01','verification-hr','Verification')", [ids.offer]);
    await pool.query("INSERT INTO public.onboarding(id,offer_id,created_by) VALUES($1,$2,'verification-hr')", [ids.onboarding, ids.offer]);
    assert.equal((await call(handlers.complete, ids.onboarding, { expectedVersion: 1 })).status, 409);
    assert.equal((await call(handlers.complete, randomUUID(), { expectedVersion: 1 })).status, 404);
    await pool.query("UPDATE public.onboarding SET checklist=$2,version=2 WHERE id=$1", [ids.onboarding, checklist]);
    assert.equal((await call(handlers.complete, ids.onboarding, { expectedVersion: 1 })).status, 409);
    await pool.query("UPDATE public.applications SET stage='Withdrawn' WHERE id=$1", [ids.application]);
    assert.equal((await call(handlers.complete, ids.onboarding, { expectedVersion: 2 })).status, 409);
    await pool.query("UPDATE public.applications SET stage='Offer' WHERE id=$1", [ids.application]);

    // Inject a failure after INSERT and stage update: all writes must roll back.
    pool.connect = async function () {
      const client = await originalConnect.call(pool);
      return {
        query(sql, values) {
          if (sql.includes('SET completed_at=now()')) throw new Error('Injected completion write failure');
          return client.query(sql, values);
        },
        release() { client.release(); },
      };
    };
    await assert.rejects(call(handlers.complete, ids.onboarding, { expectedVersion: 2 }), /Injected/);
    pool.connect = originalConnect;
    assert.equal((await pool.query("SELECT id FROM public.employees WHERE candidate_id=$1", [ids.candidate])).rows.length, 0);
    assert.equal((await pool.query("SELECT stage FROM public.applications WHERE id=$1", [ids.application])).rows[0].stage, 'Offer');
    assert.equal((await pool.query("SELECT completed_at FROM public.onboarding WHERE id=$1", [ids.onboarding])).rows[0].completed_at, null);

    const results = await Promise.all([call(handlers.complete, ids.onboarding, { expectedVersion: 2 }), call(handlers.complete, ids.onboarding, { expectedVersion: 2 })]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 201]);
    assert.equal(results[0].data.employeeId, results[1].data.employeeId);
    const employeeId = results[0].data.employeeId;
    assert.equal((await call(handlers.complete, ids.onboarding, { expectedVersion: 2 })).data.employeeId, employeeId);
    const detail = await call(employees.get, employeeId);
    assert.equal(detail.data.employee.fullName, 'Submitted name');
    assert.equal(detail.data.employee.joiningDate, '2030-06-01');
    assert.equal((await call(employees.get, randomUUID())).status, 404);
    assert((await call(employees.list)).data.employees.some(e => e.id === employeeId));
    assert.equal((await pool.query("SELECT stage FROM public.applications WHERE id=$1", [ids.application])).rows[0].stage, 'Hired');
    assert.equal((await call(handlers.update, ids.onboarding, { expectedVersion: 3, checklist })).status, 409);
    const completed = (await call(handlers.get, ids.onboarding)).data.record;
    assert.equal(completed.employeeId, employeeId);
    assert.equal(completed.completedBy, 'verification-hr');
    assert(completed.completedAt);

    // A second accepted application for this person cannot create a second employee.
    extra = { job: randomUUID(), application: randomUUID(), offer: randomUUID(), onboarding: randomUUID() };
    await pool.query("INSERT INTO public.jobs(id,title,department,location,employment_type) VALUES($1,'Verification second','HR','Hetauda','Full-time')", [extra.job]);
    await pool.query("INSERT INTO public.applications(id,candidate_id,job_id,full_name,email,phone) VALUES($1,$2,$3,'Submitted name',$4,'123')", [extra.application, ids.candidate, extra.job, email]);
    await pool.query("INSERT INTO public.offers(id,application_id,position,currency,annual_salary,sign_on_bonus,joining_date,expiry_date,benefits,status,send_status,created_by) VALUES($1,$2,'HR Assistant','NPR',600000,0,'2030-06-01','2030-05-20','','Accepted','Accepted','verification-hr')", [extra.offer, extra.application]);
    await pool.query("INSERT INTO public.offer_responses(offer_id,outcome,response_date,recorded_by,recorded_name) VALUES($1,'Accepted','2030-05-01','verification-hr','Verification')", [extra.offer]);
    await pool.query("INSERT INTO public.onboarding(id,offer_id,created_by,checklist) VALUES($1,$2,'verification-hr',$3)", [extra.onboarding, extra.offer, checklist]);
    assert.equal((await call(handlers.complete, extra.onboarding, { expectedVersion: 1 })).status, 409);
    assert.equal((await pool.query("SELECT id FROM public.employees WHERE candidate_id=$1", [ids.candidate])).rows.length, 1);
  } finally {
    pool.connect = originalConnect;
    for (const fixture of [extra, ids].filter(Boolean)) {
      await pool.query("DELETE FROM public.employees WHERE onboarding_id=$1", [fixture.onboarding]);
      await pool.query("DELETE FROM public.onboarding WHERE id=$1", [fixture.onboarding]);
      await pool.query("DELETE FROM public.offer_responses WHERE offer_id=$1", [fixture.offer]);
      await pool.query("DELETE FROM public.offers WHERE id=$1", [fixture.offer]);
      await pool.query("DELETE FROM public.applications WHERE id=$1", [fixture.application]);
      await pool.query("DELETE FROM public.jobs WHERE id=$1", [fixture.job]);
    }
    await pool.query("DELETE FROM public.candidates WHERE id=$1", [ids.candidate]);
    await pool.end();
  }
});

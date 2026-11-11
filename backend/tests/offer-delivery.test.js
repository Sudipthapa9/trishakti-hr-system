require("dotenv").config({ quiet: true });
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const brevo = require("../src/services/brevo");
const offers = require("../src/modules/offers/offers.controller");
const { offerResponseSchema } = require("../src/modules/offers/offers.schema");
const messages = require("../src/modules/communications/communications.controller");
const app = require("../src/app");

test("offer delivery snapshots, retries and uncertain outcomes", {
  skip: process.env.RUN_DATABASE_TESTS !== "1", timeout: 120000,
}, async () => {
  const originalSend = brevo.sendTransactionalEmail;
  const originalQuery = pool.query;
  const jobs = [], offerIds = [];
  let candidateId, server, calls = 0;
  const email = randomUUID() + "@example.invalid";
  brevo.sendTransactionalEmail = async (message) => {
    calls += 1;
    assert.equal(message.email, email);
    assert(message.body.includes("NPR 600000.50"));
    assert(message.body.includes("TSH-OFFER-"));
    return "offer-verification-id";
  };
  const successfulSend = brevo.sendTransactionalEmail;
  async function call(handler, body = {}, id = randomUUID()) {
    let status = 200, data;
    const res = { status(value) { status=value;return this; }, json(value) { data=value;return this; } };
    await handler({ body, params: { id }, query: {}, auth: { sub: "verification-hr" } }, res, (error) => { throw error; });
    return { status, body: data };
  }
  const fields = {
    position: "Verification position", currency: "NPR", annualSalary: "600000.50",
    signOnBonus: "10000.25", joiningDate: "2030-06-01",
    expiryDate: "2030-05-20", benefits: "Verification benefits",
  };
  async function create(changes = {}) {
    const job = (await pool.query("INSERT INTO public.jobs(title,department,location,employment_type) VALUES('Verification','HR','Hetauda','Full-time') RETURNING id")).rows[0];
    jobs.push(job.id);
    const application = (await pool.query("INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone) VALUES($1,$2,'Submitted person',$3,'12345') RETURNING id", [candidateId,job.id,email])).rows[0];
    const id = randomUUID();
    const created = await call(offers.createOffer, { ...fields, ...changes, id, applicationId: application.id });
    assert.equal(created.status, 201);
    offerIds.push(id);
    return created.body.offer;
  }
  try {
    candidateId = (await pool.query("INSERT INTO public.candidates(full_name,email,phone) VALUES('Profile person',$1,'12345') RETURNING id", [email])).rows[0].id;
    const offer = await create();
    assert.equal((await call(offers.sendOffer, { expectedVersion: 99 }, offer.id)).status,409);
    assert.equal(calls,0);
    const simultaneous = await Promise.all([
      call(offers.sendOffer,{expectedVersion:1},offer.id),
      call(offers.sendOffer,{expectedVersion:1},offer.id),
    ]);
    assert(simultaneous.some((response)=>response.status===200));
    assert.equal(calls,1);
    let saved=(await call(offers.getOffer,{},offer.id)).body.offer;
    assert.equal(saved.status,"Sent");
    assert.equal(saved.sendStatus,"Accepted");
    assert.equal(saved.delivery.providerMessageId,"offer-verification-id");
    assert.equal((await call(offers.sendOffer,{expectedVersion:1},offer.id)).status,200);
    assert.equal(calls,1);
    assert.equal((await call(offers.updateOffer,{...fields,expectedVersion:saved.version},offer.id)).status,409);
    assert.equal((await call(messages.sendMessage,{expectedVersion:1},saved.delivery.id)).status,409);
    assert.equal((await call(messages.editDraft,{subject:"Override",body:"Override",expectedVersion:1},saved.delivery.id)).status,409);
    const history=(await call(messages.getMessage,{},saved.delivery.id)).body.message;
    assert.equal(history.offerId,offer.id);
    assert(history.body.includes("Submitted person"));
    assert.equal(history.recipientName,"Submitted person");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" }).format(new Date());
    const responsePayload = { outcome: "Accepted", responseDate: today, notes: "Confirmed by phone", expectedVersion: saved.version };
    assert.equal(offerResponseSchema.safeParse({ ...responsePayload, outcome: "Invalid" }).success, false);
    assert.equal(offerResponseSchema.safeParse({ ...responsePayload, responseDate: "2030-02-30" }).success, false);
    assert.equal((await call(offers.recordOfferResponse, { ...responsePayload, expectedVersion: 999 }, offer.id)).status, 409);
    assert.equal((await call(offers.recordOfferResponse, { ...responsePayload, responseDate: "2099-01-01" }, offer.id)).status, 400);
    assert.equal((await call(offers.recordOfferResponse, { ...responsePayload, responseDate: "2000-01-01" }, offer.id)).status, 400);
    const decision = await call(offers.recordOfferResponse, responsePayload, offer.id);
    assert.equal(decision.status, 200);
    assert.equal(decision.body.offer.status, "Accepted");
    assert.equal(decision.body.offer.responseDate, today);
    assert.equal(decision.body.offer.responseAudit.recordedBy, "verification-hr");
    assert.equal((await call(offers.recordOfferResponse, responsePayload, offer.id)).status, 200);
    assert.equal((await pool.query("SELECT count(*)::int AS count FROM public.offer_responses WHERE offer_id=$1", [offer.id])).rows[0].count, 1);
    assert.equal((await call(offers.recordOfferResponse, { ...responsePayload, outcome: "Declined", expectedVersion: decision.body.offer.version }, offer.id)).status, 409);
    assert.equal((await call(offers.sendOffer,{expectedVersion:1},offer.id)).body.offer.status, "Accepted");
    assert.equal(calls, 1);
    for (const outcome of ["Declined", "Withdrawn"]) {
      const pending = await create();
      const sent = await call(offers.sendOffer, { expectedVersion: 1 }, pending.id);
      const recorded = await call(offers.recordOfferResponse, { outcome, responseDate: today, notes: "", expectedVersion: sent.body.offer.version }, pending.id);
      assert.equal(recorded.body.offer.status, outcome);
    }
    const unsent = await create();
    assert.equal((await call(offers.recordOfferResponse, { ...responsePayload, expectedVersion: 1 }, unsent.id)).status, 409);
    assert.equal((await call(offers.recordOfferResponse, responsePayload, randomUUID())).status, 404);
    const atomic = await create();
    const atomicSent = await call(offers.sendOffer, { expectedVersion: 1 }, atomic.id);
    const originalConnect = pool.connect;
    pool.connect = async function() {
      const client = await originalConnect.call(pool);
      return {
        query(sql, values) {
          if (typeof sql === "string" && sql.includes("UPDATE public.offers SET status=$1,response_date")) {
            return Promise.reject(new Error("Intentional response-write failure"));
          }
          return client.query(sql, values);
        },
        release() { client.release(); },
      };
    };
    try {
      await assert.rejects(() => call(offers.recordOfferResponse, { ...responsePayload, expectedVersion: atomicSent.body.offer.version }, atomic.id), /Intentional/);
    } finally {
      pool.connect = originalConnect;
    }
    assert.equal((await pool.query("SELECT id FROM public.offer_responses WHERE offer_id=$1", [atomic.id])).rows.length, 0);
    assert.equal((await call(offers.getOffer, {}, atomic.id)).body.offer.status, "Sent");
    const stages = await pool.query(`
      SELECT a.stage FROM public.applications a
      JOIN public.offers o ON o.application_id=a.id WHERE o.id=$1
    `, [offer.id]);
    assert.equal(stages.rows[0].stage, "Review");

    const expired=await create({expiryDate:"2000-01-01",joiningDate:"2000-02-01"});
    assert.equal((await call(offers.sendOffer,{expectedVersion:1},expired.id)).status,409);
    const placeholders=await create({benefits:"Replace {{benefits}}"});
    assert.equal((await call(offers.sendOffer,{expectedVersion:1},placeholders.id)).status,400);
    for(const outcome of ["Failed","Unknown"]){
      const record=await create();
      brevo.sendTransactionalEmail=async()=>{throw new brevo.BrevoSendError("Verification error",outcome)};
      const failure=await call(offers.sendOffer,{expectedVersion:1},record.id);
      assert.equal(failure.status,502);
      assert.equal(failure.body.offer.sendStatus,outcome);
      assert.equal(failure.body.offer.status,"Draft");
      const updatedVersion=failure.body.offer.version;
      const edit=await call(offers.updateOffer,{...fields,expectedVersion:updatedVersion},record.id);
      if(outcome==="Unknown"){
        assert.equal(edit.status,409);
        assert.equal((await call(offers.sendOffer,{expectedVersion:updatedVersion},record.id)).status,409);
      }else{
        assert.equal(edit.status,200);
        brevo.sendTransactionalEmail=successfulSend;
        assert.equal((await call(offers.sendOffer,{expectedVersion:edit.body.offer.version},record.id)).body.offer.status,"Sent");
      }
    }
    // Provider acceptance survives a failed final offer write, without a second email.
    const recovery=await create();
    brevo.sendTransactionalEmail=successfulSend;
    pool.query=async function(sql,values){
      if(typeof sql==="string"&&sql.includes("UPDATE public.offers SET send_status=$1")){
        throw new Error("Intentional final-write failure");
      }
      return originalQuery.call(pool,sql,values);
    };
    await assert.rejects(()=>call(offers.sendOffer,{expectedVersion:1},recovery.id),/Intentional/);
    pool.query=originalQuery;
    const before=calls;
    assert.equal((await call(offers.sendOffer,{expectedVersion:1},recovery.id)).body.offer.status,"Sent");
    assert.equal(calls,before);
    server=app.listen(0,"127.0.0.1");
    await new Promise(resolve=>server.once("listening",resolve));
    const access=await fetch("http://127.0.0.1:"+server.address().port+"/api/offers/"+offer.id+"/send",{method:"POST"});
    assert.equal(access.status,401);
    const responseAccess = await fetch("http://127.0.0.1:"+server.address().port+"/api/offers/"+offer.id+"/response", { method: "POST" });
    assert.equal(responseAccess.status,401);
  } finally {
    pool.query=originalQuery;
    brevo.sendTransactionalEmail=originalSend;
    if(server)await new Promise(resolve=>server.close(resolve));
    await pool.query("DELETE FROM public.offer_responses WHERE offer_id=ANY($1::uuid[])",[offerIds]);
    await pool.query("DELETE FROM public.communications WHERE offer_id=ANY($1::uuid[])",[offerIds]);
    await pool.query("DELETE FROM public.offers WHERE id=ANY($1::uuid[])",[offerIds]);
    await pool.query("DELETE FROM public.applications WHERE job_id=ANY($1::uuid[])",[jobs]);
    await pool.query("DELETE FROM public.jobs WHERE id=ANY($1::uuid[])",[jobs]);
    if(candidateId)await pool.query("DELETE FROM public.candidates WHERE id=$1",[candidateId]);
    await pool.end();
  }
});

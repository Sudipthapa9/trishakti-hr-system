require('dotenv').config({quiet:true});
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const pool=require('../src/config/db');
const h=require('../src/modules/onboarding/onboarding.controller');
const {checklistSchema}=require('../src/modules/onboarding/onboarding.schema');
const app=require('../src/app');
test('onboarding validates checklist fields and rejects unauthenticated requests', async () => {
  const { startSchema } = require('../src/modules/onboarding/onboarding.schema');
  assert.equal(startSchema.safeParse({ offerId: randomUUID() }).success, true);
  assert.equal(startSchema.safeParse({ offerId: 'bad' }).success, false);
  const checklist = { documents: false, payroll: false, accounts: false, orientation: false };
  assert.equal(checklistSchema.safeParse({ expectedVersion: 1, checklist }).success, true);
  assert.equal(checklistSchema.safeParse({ expectedVersion: 0, checklist }).success, false);
  assert.equal(checklistSchema.safeParse({ expectedVersion: 1, checklist: { ...checklist, documents: 'yes' } }).success, false);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/onboarding`;
    for (const [path, method] of [['', 'GET'], ['', 'POST'], ['/' + randomUUID(), 'PATCH']]) {
      assert.equal((await fetch(base + path, { method })).status, 401);
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});
test('accepted offer onboarding persists, repeats safely and rejects stale edits',{skip:process.env.RUN_DATABASE_TESTS!=='1',timeout:60000},async()=>{
 const c=await pool.connect(), original=pool.query; pool.query=c.query.bind(c); let server;
 async function call(handler,body={},id=randomUUID()) {let status=200,data; await handler({body,params:{id},query:{},auth:{sub:'verification-hr'}},{status(s){status=s;return this;},json(d){data=d;return this;}},e=>{throw e;}); return {status,data};}
 try {
  await c.query('BEGIN');
  const email=randomUUID()+'@example.invalid';
  const candidate=(await c.query("INSERT INTO public.candidates(full_name,email,phone) VALUES('Verification',$1,'123') RETURNING id",[email])).rows[0];
  const job=(await c.query("INSERT INTO public.jobs(title,department,location,employment_type) VALUES('Verification','HR','Hetauda','Full-time') RETURNING id")).rows[0];
  const a=(await c.query("INSERT INTO public.applications(candidate_id,job_id,full_name,email,phone) VALUES($1,$2,'Submitted name',$3,'123') RETURNING id",[candidate.id,job.id,email])).rows[0];
  const o=(await c.query("INSERT INTO public.offers(id,application_id,position,currency,annual_salary,sign_on_bonus,joining_date,expiry_date,benefits,created_by) VALUES($1,$2,'HR Assistant','NPR',600000,0,'2030-06-01','2030-05-20','','verification-hr') RETURNING id",[randomUUID(),a.id])).rows[0];
  assert.equal((await call(h.start,{offerId:o.id})).status,409);
  await c.query("UPDATE public.offers SET status='Accepted',send_status='Accepted' WHERE id=$1",[o.id]);
  assert.equal((await call(h.start,{offerId:o.id})).status,409);
  await c.query("INSERT INTO public.offer_responses(offer_id,outcome,response_date,recorded_by,recorded_name) VALUES($1,'Accepted','2030-05-01','verification-hr','Verification')",[o.id]);
  const first=await call(h.start,{offerId:o.id}); assert.equal(first.status,201);
  const repeat=await call(h.start,{offerId:o.id}); assert.equal(repeat.status,200);assert.equal(repeat.data.id,first.data.id);
  assert.equal((await call(h.get,{},first.data.id)).data.record.candidateName,'Submitted name');
  const checklist={documents:true,payroll:false,accounts:false,orientation:false};
  assert.equal(checklistSchema.safeParse({expectedVersion:1,checklist:{documents:true}}).success,false);
  const saved=await call(h.update,{expectedVersion:1,checklist},first.data.id);
  assert.equal(saved.data.record.version,2);assert.deepEqual(saved.data.record.checklist,checklist);
  assert.equal((await call(h.update,{expectedVersion:1,checklist},first.data.id)).status,409);
  assert.equal((await call(h.get)).status,404);
  assert((await call(h.list)).data.records.some(r=>r.id===first.data.id));
  assert.equal((await c.query('SELECT stage FROM public.applications WHERE id=$1',[a.id])).rows[0].stage,'Review');
  server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/api/onboarding`)).status,401);
 } finally {if(server)await new Promise(r=>server.close(r));await c.query('ROLLBACK');pool.query=original;c.release();await pool.end();}
});

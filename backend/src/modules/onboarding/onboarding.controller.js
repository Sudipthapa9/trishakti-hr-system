const { z } = require("zod");
const pool = require("../../config/db");
const selection = `n.id, n.offer_id AS "offerId", n.checklist, n.version,
  n.created_at AS "createdAt", a.full_name AS "candidateName", a.email,
  o.position, to_char(o.joining_date,'YYYY-MM-DD') AS "joiningDate",
  j.department, j.location, n.completed_at AS "completedAt",
  n.completed_by AS "completedBy",
  (SELECT e.id FROM public.employees e WHERE e.onboarding_id=n.id) AS "employeeId"`;
const joins = `FROM public.onboarding n JOIN public.offers o ON o.id=n.offer_id
  JOIN public.applications a ON a.id=o.application_id JOIN public.jobs j ON j.id=a.job_id`;

async function list(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`SELECT ${selection} ${joins}
      ORDER BY n.created_at DESC,n.id DESC LIMIT 21 OFFSET $1`, [(page.data - 1) * 20]);
    res.json({ records: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) { next(error); }
}
async function get(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${selection} ${joins} WHERE n.id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Onboarding record not found." });
    res.json({ record: result.rows[0] });
  } catch (error) { next(error); }
}
async function start(req, res, next) {
  try {
    // INSERT ... SELECT checks eligibility without trusting frontend status.
    const result = await pool.query(`INSERT INTO public.onboarding(offer_id,created_by)
      SELECT o.id,$2 FROM public.offers o
      WHERE o.id=$1 AND o.status='Accepted' AND o.send_status='Accepted'
        AND EXISTS (SELECT 1 FROM public.offer_responses r WHERE r.offer_id=o.id AND r.outcome='Accepted')
      ON CONFLICT (offer_id) DO NOTHING RETURNING id`, [req.body.offerId, req.auth.sub]);
    const saved = await pool.query("SELECT id FROM public.onboarding WHERE offer_id=$1", [req.body.offerId]);
    if (!saved.rows.length) return res.status(409).json({ error: "A recorded accepted offer is required to start onboarding." });
    res.status(result.rows.length ? 201 : 200).json({ id: saved.rows[0].id });
  } catch (error) { next(error); }
}
async function update(req, res, next) {
  try {
    const result = await pool.query(`UPDATE public.onboarding SET checklist=$1::jsonb,
      version=version+1,updated_at=now() WHERE id=$2 AND version=$3 AND completed_at IS NULL RETURNING id`,
    [JSON.stringify(req.body.checklist), req.params.id, req.body.expectedVersion]);
    if (!result.rows.length) return res.status(409).json({ error: "Record changed or was removed. Reload before saving." });
    return get(req, res, next);
  } catch (error) { next(error); }
}
async function complete(req, res, next) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    // Serialize completion and checklist writes for this record. Lock the
    // application too so a concurrent stage change cannot race this hire.
    const result = await client.query(`SELECT n.*, o.status AS offer_status,
      o.send_status, o.position, o.joining_date, a.id AS application_id,
      a.candidate_id, a.full_name, a.email, a.phone, a.stage,
      j.department, j.location
      FROM public.onboarding n JOIN public.offers o ON o.id=n.offer_id
      JOIN public.applications a ON a.id=o.application_id
      JOIN public.jobs j ON j.id=a.job_id WHERE n.id=$1 FOR UPDATE OF n,a,o`, [req.params.id]);
    const record = result.rows[0];
    async function reject(status, error) {
      await client.query("ROLLBACK");
      return res.status(status).json({ error });
    }
    if (!record) return await reject(404, "Onboarding record not found.");
    // A lost HTTP response can be retried safely after the transaction commits.
    if (record.completed_at) {
      const existing = await client.query("SELECT id FROM public.employees WHERE onboarding_id=$1", [record.id]);
      await client.query("COMMIT");
      return res.json({ employeeId: existing.rows[0].id });
    }
    if (record.version !== req.body.expectedVersion) return await reject(409, "Record changed. Reload before completing onboarding.");
    if (!["documents", "payroll", "accounts", "orientation"].every(key => record.checklist[key] === true)) {
      return await reject(409, "Complete all four checklist actions first.");
    }
    const acceptance = await client.query("SELECT id FROM public.offer_responses WHERE offer_id=$1 AND outcome='Accepted'", [record.offer_id]);
    if (record.offer_status !== "Accepted" || record.send_status !== "Accepted" || !acceptance.rows.length || ["Rejected", "Withdrawn", "Hired"].includes(record.stage)) {
      return await reject(409, "The application and accepted offer are no longer eligible for onboarding completion.");
    }
    // Unique candidate/application/onboarding keys also guard concurrent hires
    // from different offers for the same person.
    const employee = await client.query(`INSERT INTO public.employees (
      onboarding_id,candidate_id,application_id,full_name,email,phone,
      position,department,location,joining_date,created_by
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [
      record.id, record.candidate_id, record.application_id, record.full_name,
      record.email, record.phone, record.position, record.department,
      record.location, record.joining_date, req.auth.sub,
    ]);
    await client.query(`UPDATE public.applications SET stage='Hired',updated_at=now() WHERE id=$1`, [record.application_id]);
    await client.query(`UPDATE public.onboarding SET completed_at=now(),completed_by=$2,
      version=version+1,updated_at=now() WHERE id=$1`, [record.id, req.auth.sub]);
    await client.query("COMMIT");
    return res.status(201).json({ employeeId: employee.rows[0].id });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") return res.status(409).json({ error: "An employee record already exists for this candidate or application." });
    next(error);
  } finally { if (client) client.release(); }
}
module.exports = { list, get, start, update, complete };

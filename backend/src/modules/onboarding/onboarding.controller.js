const { z } = require("zod");
const pool = require("../../config/db");
const selection = `n.id, n.offer_id AS "offerId", n.checklist, n.version,
  n.created_at AS "createdAt", a.full_name AS "candidateName", a.email,
  o.position, to_char(o.joining_date,'YYYY-MM-DD') AS "joiningDate",
  j.department, j.location`;
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
      version=version+1,updated_at=now() WHERE id=$2 AND version=$3 RETURNING id`,
    [JSON.stringify(req.body.checklist), req.params.id, req.body.expectedVersion]);
    if (!result.rows.length) return res.status(409).json({ error: "Record changed or was removed. Reload before saving." });
    return get(req, res, next);
  } catch (error) { next(error); }
}
module.exports = { list, get, start, update };

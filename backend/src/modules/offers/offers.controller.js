const { z } = require("zod");
const pool = require("../../config/db");

const columns = `o.id, o.application_id AS "applicationId", o.position, o.currency,
  o.annual_salary::text AS "annualSalary", o.sign_on_bonus::text AS "signOnBonus",
  to_char(o.joining_date, 'YYYY-MM-DD') AS "joiningDate",
  to_char(o.expiry_date, 'YYYY-MM-DD') AS "expiryDate",
  o.benefits, o.status, o.version, o.created_at AS "createdAt", o.updated_at AS "updatedAt"`;
const details = `${columns}, a.full_name AS "candidateName", a.email AS "candidateEmail", j.title AS "jobTitle"`;

async function listOffers(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`
      SELECT ${details} FROM public.offers o
      JOIN public.applications a ON a.id=o.application_id JOIN public.jobs j ON j.id=a.job_id
      ORDER BY o.created_at DESC, o.id DESC LIMIT 21 OFFSET $1
    `, [(page.data - 1) * 20]);
    res.json({ offers: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) { next(error); }
}

async function getOffer(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT ${details} FROM public.offers o
      JOIN public.applications a ON a.id=o.application_id JOIN public.jobs j ON j.id=a.job_id
      WHERE o.id=$1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Offer not found." });
    res.json({ offer: result.rows[0] });
  } catch (error) { next(error); }
}

async function createOffer(req, res, next) {
  const { id, applicationId, position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO public.offers AS o (
        id, application_id, position, currency, annual_salary, sign_on_bonus,
        joining_date, expiry_date, benefits, created_by
      )
      SELECT $1, a.id, $3, $4, $5, $6, $7, $8, $9, $10
      FROM public.applications a WHERE a.id=$2
      ON CONFLICT DO NOTHING RETURNING ${columns}
    `, [id, applicationId, position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits, req.auth.sub]);
    if (result.rows.length) return res.status(201).json({ offer: result.rows[0] });
    // A repeated identical request returns the original row. Another offer for
    // the same application must be opened and edited rather than duplicated.
    const existing = await pool.query(`
      SELECT ${columns} FROM public.offers o WHERE o.id=$1
        AND o.application_id=$2 AND o.position=$3 AND o.currency=$4
        AND o.annual_salary=$5 AND o.sign_on_bonus=$6
        AND o.joining_date=$7 AND o.expiry_date=$8 AND o.benefits=$9
    `, [id, applicationId, position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits]);
    if (existing.rows.length) return res.json({ offer: existing.rows[0] });
    const application = await pool.query("SELECT id FROM public.applications WHERE id=$1", [applicationId]);
    if (!application.rows.length) return res.status(404).json({ error: "Application not found." });
    return res.status(409).json({ error: "An offer already exists for this application or this reference has changed. Open the saved offer." });
  } catch (error) { next(error); }
}

async function updateOffer(req, res, next) {
  const { position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits, expectedVersion } = req.body;
  try {
    const result = await pool.query(`
      UPDATE public.offers AS o SET position=$1, currency=$2, annual_salary=$3,
        sign_on_bonus=$4, joining_date=$5, expiry_date=$6, benefits=$7,
        version=version+1, updated_at=now()
      WHERE o.id=$8 AND o.version=$9 AND o.status='Draft'
      RETURNING ${columns}
    `, [position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits, req.params.id, expectedVersion]);
    if (result.rows.length) return res.json({ offer: result.rows[0] });
    const existing = await pool.query("SELECT id FROM public.offers WHERE id=$1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Offer not found." });
    return res.status(409).json({ error: "Offer changed or is no longer a draft. Reload before editing." });
  } catch (error) { next(error); }
}

module.exports = { listOffers, getOffer, createOffer, updateOffer };

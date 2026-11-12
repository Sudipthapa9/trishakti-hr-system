const { z } = require("zod");
const pool = require("../../config/db");
const columns = `id, onboarding_id AS "onboardingId", candidate_id AS "candidateId",
  application_id AS "applicationId", full_name AS "fullName", email, phone,
  position, department, location, to_char(joining_date,'YYYY-MM-DD') AS "joiningDate",
  created_at AS "createdAt", created_by AS "createdBy"`;
async function list(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.employees ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $1`, [(page.data - 1) * 20]);
    res.json({ employees: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) { next(error); }
}
async function get(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.employees WHERE id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Employee record not found." });
    res.json({ employee: result.rows[0] });
  } catch (error) { next(error); }
}

module.exports = { list, get };

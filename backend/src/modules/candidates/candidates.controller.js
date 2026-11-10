const { z } = require("zod");
const pool = require("../../config/db");

const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional().default(""),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
}).strict();

async function listCandidates(req, res, next) {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Provide a valid search and page number." });
  }
  const { search, page } = parsed.data;
  try {
    // strpos treats search input literally, including SQL wildcard characters.
    const result = await pool.query(`
      SELECT c.id, c.full_name AS "fullName", c.email, c.phone,
        c.created_at AS "createdAt",
        (SELECT count(*)::int FROM public.applications a
          WHERE a.candidate_id = c.id) AS "applicationCount"
      FROM public.candidates c
      WHERE $1::text = ''
        OR strpos(lower(c.full_name), lower($1)) > 0
        OR strpos(lower(c.email), lower($1)) > 0
        OR strpos(c.phone, $1) > 0
      ORDER BY c.created_at DESC, c.id DESC
      LIMIT 21 OFFSET $2
    `, [search, (page - 1) * 20]);
    res.json({
      candidates: result.rows.slice(0, 20),
      page,
      hasMore: result.rows.length > 20,
    });
  } catch (error) {
    next(error);
  }
}

async function getCandidate(req, res, next) {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(400).json({ error: "Invalid candidate identifier." });
  }
  try {
    const result = await pool.query(`
      SELECT c.id, c.full_name AS "fullName", c.email, c.phone,
        c.created_at AS "createdAt",
        COALESCE((
          SELECT jsonb_agg(jsonb_build_object(
            'id', a.id, 'jobId', a.job_id, 'jobTitle', j.title,
            'jobStatus', j.status, 'stage', a.stage,
            'fullName', a.full_name, 'email', a.email, 'phone', a.phone,
            'coverLetter', a.cover_letter, 'createdAt', a.created_at,
            'hasResume', EXISTS (
              SELECT 1 FROM public.application_resumes r WHERE r.application_id = a.id
            )
          ) ORDER BY a.created_at DESC, a.id DESC)
          FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
          WHERE a.candidate_id = c.id
        ), '[]'::jsonb) AS applications
      FROM public.candidates c WHERE c.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Candidate not found." });
    res.json({ candidate: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = { listCandidates, getCandidate };

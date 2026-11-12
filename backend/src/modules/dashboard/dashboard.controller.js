const { z } = require("zod");
const pool = require("../../config/db");
async function getDashboard(req, res, next) {
  const days = z.coerce
    .number()
    .refine((n) => n === 7 || n === 30)
    .safeParse(req.query.days ?? 30);
  if (!days.success)
    return res.status(400).json({ error: "Choose 7 or 30 days." });
  try {
    // One SQL statement gives totals and panels the same database snapshot.
    const result = await pool.query(
      `SELECT
      (SELECT count(*)::int FROM public.applications) AS "totalApplications",
      (SELECT count(*)::int FROM public.jobs WHERE status='Open' AND (closing_date IS NULL OR closing_date >= (now() AT TIME ZONE 'Asia/Kathmandu')::date)) AS "openJobs",
      (SELECT count(*)::int FROM public.interviews WHERE status='Scheduled' AND starts_at>=now()) AS "upcomingInterviews",
      (SELECT count(*)::int FROM public.onboarding WHERE completed_at IS NULL) AS "pendingOnboarding",
      (SELECT count(*)::int FROM public.employees) AS employees,
      (SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT a.id,a.candidate_id AS "candidateId",a.full_name AS name,a.stage,a.created_at AS "createdAt",j.title AS "jobTitle" FROM public.applications a JOIN public.jobs j ON j.id=a.job_id ORDER BY a.created_at DESC,a.id DESC LIMIT 8) t) AS recent,
      (SELECT coalesce(jsonb_agg(t),'[]'::jsonb) FROM (SELECT i.id,a.full_name AS name,j.title AS "jobTitle",i.starts_at AS "startsAt" FROM public.interviews i JOIN public.applications a ON a.id=i.application_id JOIN public.jobs j ON j.id=a.job_id WHERE i.status='Scheduled' AND i.starts_at>=now() ORDER BY i.starts_at,i.id LIMIT 5) t) AS upcoming,
      (SELECT jsonb_agg(t ORDER BY t.day) FROM (
        SELECT to_char(d.day,'YYYY-MM-DD') AS day,count(a.id)::int AS count
        FROM generate_series((now() AT TIME ZONE 'Asia/Kathmandu')::date-($1::int-1),(now() AT TIME ZONE 'Asia/Kathmandu')::date,interval '1 day') d(day)
        LEFT JOIN public.applications a ON (a.created_at AT TIME ZONE 'Asia/Kathmandu')::date=d.day::date
        GROUP BY d.day) t) AS volume`,
      [days.data],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
}
module.exports = { getDashboard };

const pool = require("../../config/db");

const { z } = require("zod");

// Internal responses include screening configuration used by the HR editor.
const jobColumns = `
  id, title, department, location, employment_type AS "employmentType",
  description, status, to_char(closing_date, 'YYYY-MM-DD') AS "closingDate",
  responsibilities, required_skills AS "requiredSkills",
  preferred_skills AS "preferredSkills", vacancies,
  shortlist_multiplier AS "shortlistMultiplier",
  (SELECT count(*)::int FROM public.applications a WHERE a.job_id = jobs.id) AS applicants
`;

// Read jobs from PostgreSQL for authenticated HR users.
async function getJobs(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT ${jobColumns} FROM public.jobs ORDER BY created_at DESC
    `);
    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
}

// Accept defaults for clients created before the additional form fields existed.
async function createJob(req, res, next) {
  const {
    title, department, location, employmentType, description,
    closingDate = "", responsibilities = "",
    requiredSkills = [], preferredSkills = [],
    vacancies = 1, shortlistMultiplier = 5,
  } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO public.jobs (
        title, department, location, employment_type, description, status,
        closing_date, responsibilities, required_skills, preferred_skills,
        vacancies, shortlist_multiplier
      )
      VALUES ($1, $2, $3, $4, $5, 'Draft', $6, $7, $8::jsonb, $9::jsonb, $10, $11)
      RETURNING ${jobColumns}
    `, [
      title, department, location, employmentType, description,
      closingDate || null, responsibilities,
      JSON.stringify(requiredSkills), JSON.stringify(preferredSkills),
      vacancies, shortlistMultiplier,
    ]);
    res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function getPublicJobs(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT id, title, department, location,
        employment_type AS "employmentType", description, status,
        to_char(closing_date, 'YYYY-MM-DD') AS "closingDate", responsibilities
      FROM public.jobs WHERE status = 'Open'
      ORDER BY created_at DESC
    `);
    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
}

// Use presence checks for closingDate so an empty value can clear a saved date.
async function updateJob(req, res, next) {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(400).json({ error: "Invalid job identifier" });
  }
  const {
    title, department, location, employmentType, description, status,
    closingDate, responsibilities, requiredSkills, preferredSkills,
    vacancies, shortlistMultiplier,
  } = req.body;
  try {
    const result = await pool.query(`
      UPDATE public.jobs SET
        title = COALESCE($1, title),
        department = COALESCE($2, department),
        location = COALESCE($3, location),
        employment_type = COALESCE($4, employment_type),
        description = COALESCE($5, description),
        status = COALESCE($6, status),
        closing_date = CASE WHEN $7::boolean THEN $8::date ELSE closing_date END,
        responsibilities = COALESCE($9, responsibilities),
        required_skills = COALESCE($10::jsonb, required_skills),
        preferred_skills = COALESCE($11::jsonb, preferred_skills),
        vacancies = COALESCE($12, vacancies),
        shortlist_multiplier = COALESCE($13, shortlist_multiplier),
        updated_at = now()
      WHERE id = $14
      RETURNING ${jobColumns}
    `, [
      title, department, location, employmentType, description, status,
      closingDate !== undefined, closingDate || null, responsibilities,
      requiredSkills === undefined ? null : JSON.stringify(requiredSkills),
      preferredSkills === undefined ? null : JSON.stringify(preferredSkills),
      vacancies, shortlistMultiplier, req.params.id,
    ]);
    if (!result.rows.length) return res.status(404).json({ error: "Job not found" });
    res.json({ job: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

module.exports = { getJobs, getPublicJobs, createJob, updateJob };

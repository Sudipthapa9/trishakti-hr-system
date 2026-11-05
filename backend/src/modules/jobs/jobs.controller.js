const pool = require("../../config/db");

// Read jobs from PostgreSQL and return them as JSON.
async function getJobs(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        department,
        location,
        employment_type AS "employmentType",
        description,
        status,
        closing_date AS "closingDate"
      FROM public.jobs
      ORDER BY created_at DESC
    `);

    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
}
// Save a validated job as a draft.
async function createJob(req, res, next) {
  const {
    title,
    department,
    location,
    employmentType,
    description,
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO public.jobs (
        title,
        department,
        location,
        employment_type,
        description,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'Draft')
      RETURNING
        id,
        title,
        department,
        location,
        employment_type AS "employmentType",
        description,
        status,
        closing_date AS "closingDate"`,
      [title, department, location, employmentType, description]
    );

    res.status(201).json({ job: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
// Return only fields meant for the public careers page.
async function getPublicJobs(req, res, next) {
  try {
    const result = await pool.query(`
      SELECT
        id,
        title,
        department,
        location,
        employment_type AS "employmentType",
        description,
        status,
        closing_date AS "closingDate"
      FROM public.jobs
      WHERE status = 'Open'
      ORDER BY created_at DESC
    `);

    res.json({ jobs: result.rows });
  } catch (error) {
    next(error);
  }
}

module.exports = { getJobs, getPublicJobs, createJob };

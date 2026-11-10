const { createHash } = require("node:crypto");
const path = require("node:path");
const { z } = require("zod");
const pool = require("../../config/db");
const { applicationSchema } = require("./applications.schema");
const { validateResume } = require("./resume-validation");

async function submitApplication(req, res, next) {
  const parsed = applicationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Check your name, email, phone and cover letter." });
  }
  let mediaType;
  try {
    mediaType = await validateResume(req.file);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  const { requestId, jobId, fullName, email, phone, coverLetter } = parsed.data;
  const fileHash = createHash("sha256").update(req.file.buffer).digest("hex");
  const fingerprint = createHash("sha256")
    .update(JSON.stringify([jobId, fullName, email, phone, coverLetter, fileHash]))
    .digest("hex");
  const receipt = {
    reference: "TSH-" + requestId,
    candidateName: fullName,
    jobId,
  };
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serialize retries of the same request, including concurrent requests.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [requestId]);
    const existing = await client.query(
      "SELECT submission_hash FROM public.applications WHERE id = $1", [requestId],
    );
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      if (existing.rows[0].submission_hash !== fingerprint) {
        return res.status(409).json({ error: "This submission reference has already been used. Change a field before submitting again." });
      }
      return res.json({ application: receipt });
    }
    // A status change must wait until this accepted application has committed.
    const job = await client.query(`
      SELECT title FROM public.jobs
      WHERE id = $1 AND status = 'Open'
        AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
      FOR SHARE
    `, [jobId]);
    if (!job.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "This job is closed or no longer accepting applications." });
    }
    // Matching an email never overwrites an existing person's contact profile.
    await client.query(`
      INSERT INTO public.candidates (full_name, email, phone)
      VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING
    `, [fullName, email, phone]);
    const candidate = await client.query("SELECT id FROM public.candidates WHERE email = $1", [email]);
    const filename = path.basename(req.file.originalname.replaceAll("\\", "/"))
      .replace(/[\x00-\x1f\x7f]/g, "").slice(0, 200) || "resume";
    await client.query(`
      INSERT INTO public.applications (
        id, candidate_id, job_id, full_name, email, phone, cover_letter,
        resume_storage_key, resume_original_name, resume_media_type,
        resume_size_bytes, submission_hash
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, ($1::uuid)::text, $8, $9, $10, $11)
    `, [requestId, candidate.rows[0].id, jobId, fullName, email, phone,
      coverLetter, filename, mediaType, req.file.size, fingerprint]);
    await client.query(`
      INSERT INTO public.application_resumes (application_id, content) VALUES ($1, $2)
    `, [requestId, req.file.buffer]);
    await client.query("COMMIT");
    return res.status(201).json({ application: { ...receipt, jobTitle: job.rows[0].title } });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res.status(409).json({ error: "An application with this email has already been submitted for this job." });
    }
    next(error);
  } finally {
    client.release();
  }
}

async function listApplications(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`
      SELECT a.id, a.candidate_id AS "candidateId", a.job_id AS "jobId",
        a.full_name AS "fullName", a.email, a.phone, a.cover_letter AS "coverLetter",
        a.stage, a.created_at AS "createdAt", j.title AS "jobTitle",
        a.resume_original_name AS "resumeName",
        EXISTS (SELECT 1 FROM public.application_resumes r WHERE r.application_id = a.id) AS "hasResume"
      FROM public.applications a JOIN public.jobs j ON j.id = a.job_id
      ORDER BY a.created_at DESC, a.id DESC LIMIT 21 OFFSET $1
    `, [(page.data - 1) * 20]);
    res.json({ applications: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) {
    next(error);
  }
}

async function downloadResume(req, res, next) {
  if (!z.string().uuid().safeParse(req.params.id).success) {
    return res.status(400).json({ error: "Invalid application identifier." });
  }
  try {
    const result = await pool.query(`
      SELECT r.content, a.resume_original_name, a.resume_media_type
      FROM public.application_resumes r
      JOIN public.applications a ON a.id = r.application_id WHERE a.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "CV not found." });
    const file = result.rows[0];
    res.set("Cache-Control", "no-store");
    res.set("X-Content-Type-Options", "nosniff");
    res.attachment(file.resume_original_name);
    res.type(file.resume_media_type);
    res.send(file.content);
  } catch (error) {
    next(error);
  }
}

module.exports = { submitApplication, listApplications, downloadResume };

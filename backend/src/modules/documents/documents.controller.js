const path = require("node:path");
const { z } = require("zod");
const pool = require("../../config/db");
const { validateResume } = require("../applications/resume-validation");
async function list(req, res, next) {
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(
      `SELECT id,original_name AS name,media_type AS "mediaType",size_bytes AS size,uploaded_by AS "uploadedBy",created_at AS "createdAt"
      FROM public.onboarding_documents WHERE onboarding_id=$1 ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $2`,
      [req.params.id, (page.data - 1) * 20],
    );
    res.json({
      documents: result.rows.slice(0, 20),
      hasMore: result.rows.length > 20,
    });
  } catch (error) {
    next(error);
  }
}
async function upload(req, res, next) {
  const parsed = z
    .object({ id: z.string().uuid() })
    .strict()
    .safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "A document reference is required." });
  let mediaType;
  try {
    mediaType = await validateResume(req.file);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
  try {
    const name = path
      .basename(req.file.originalname.replace(/\\/g, "/"))
      .replace(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 200);
    const result = await pool.query(
      `INSERT INTO public.onboarding_documents(id,onboarding_id,original_name,media_type,size_bytes,content,uploaded_by)
      SELECT $1,n.id,$3,$4,$5,$6,$7 FROM public.onboarding n WHERE n.id=$2
      ON CONFLICT(id) DO NOTHING RETURNING id`,
      [
        parsed.data.id,
        req.params.id,
        name,
        mediaType,
        req.file.size,
        req.file.buffer,
        req.auth.sub,
      ],
    );
    if (!result.rows.length) {
      const existing = await pool.query(
        "SELECT id FROM public.onboarding_documents WHERE id=$1 AND onboarding_id=$2 AND content=$3 AND original_name=$4",
        [parsed.data.id, req.params.id, req.file.buffer, name],
      );
      if (!existing.rows.length)
        return res
          .status(409)
          .json({
            error:
              "Record not found or this document reference has different contents.",
          });
    }
    res.status(result.rows.length ? 201 : 200).json({ id: parsed.data.id });
  } catch (error) {
    next(error);
  }
}
async function download(req, res, next) {
  try {
    const result = await pool.query(
      "SELECT original_name,media_type,content FROM public.onboarding_documents WHERE id=$1 AND onboarding_id=$2",
      [req.params.documentId, req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Document not found." });
    const file = result.rows[0];
    res.set("X-Content-Type-Options", "nosniff");
    res.attachment(file.original_name);
    res.type(file.media_type);
    res.send(file.content);
  } catch (error) {
    next(error);
  }
}
module.exports = { list, upload, download };

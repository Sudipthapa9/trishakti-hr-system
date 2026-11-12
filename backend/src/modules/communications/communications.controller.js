const { z } = require("zod");
const pool = require("../../config/db");
const { deliverMessage, messageColumns } = require("./communications.delivery");

const draftFields = {
  subject: z.string().trim().min(1).max(200).regex(/^[^\r\n]+$/),
  body: z.string().trim().min(1).max(10000),
};
const createDraftSchema = z.object({
  id: z.string().uuid(), applicationId: z.string().uuid(), ...draftFields,
}).strict();
const editDraftSchema = z.object({
  ...draftFields, expectedVersion: z.number().int().min(1),
}).strict();
const sendSchema = z.object({ expectedVersion: z.number().int().min(1) }).strict();
const columns = messageColumns;

async function listMessages(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`
      SELECT ${columns} FROM public.communications
      ORDER BY created_at DESC, id DESC LIMIT 21 OFFSET $1
    `, [(page.data - 1) * 20]);
    res.json({ messages: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) { next(error); }
}

async function getMessage(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.communications WHERE id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Message not found." });
    res.json({ message: result.rows[0] });
  } catch (error) { next(error); }
}

async function createDraft(req, res, next) {
  const { id, applicationId, subject, body } = req.body;
  try {
    // Select the recipient on the server from the application snapshot.
    const result = await pool.query(`
      INSERT INTO public.communications (
        id, application_id, recipient_email, recipient_name, subject, body, created_by
      )
      SELECT $1, a.id, a.email, a.full_name, $3, $4, $5
      FROM public.applications a WHERE a.id = $2
      ON CONFLICT (id) DO NOTHING RETURNING ${columns}
    `, [id, applicationId, subject, body, req.auth.sub]);
    if (result.rows.length) return res.status(201).json({ message: result.rows[0] });
    const existing = await pool.query(`SELECT ${columns} FROM public.communications WHERE id = $1`, [id]);
    const saved = existing.rows[0];
    if (!saved) return res.status(404).json({ error: "Application not found." });
    if (saved.applicationId !== applicationId || saved.subject !== subject || saved.body !== body) {
      return res.status(409).json({ error: "This draft reference already contains different content." });
    }
    return res.json({ message: saved });
  } catch (error) { next(error); }
}

async function editDraft(req, res, next) {
  const { subject, body, expectedVersion } = req.body;
  try {
    const result = await pool.query(`
      UPDATE public.communications SET subject=$1, body=$2, status='Draft',
        version=version+1, last_error=NULL, updated_at=now()
      WHERE id=$3 AND version=$4 AND status IN ('Draft','Failed') AND offer_id IS NULL AND interview_id IS NULL
      RETURNING ${columns}
    `, [subject, body, req.params.id, expectedVersion]);
    if (!result.rows.length) return res.status(409).json({ error: "Draft changed or has already been submitted. Reload it before editing." });
    res.json({ message: result.rows[0] });
  } catch (error) { next(error); }
}

async function sendMessage(req, res, next) {
  try {
    const result = await deliverMessage(req.params.id, req.body.expectedVersion);
    res.status(result.status).json(result.body);
  } catch (error) {
    next(error);
  }
}

async function checkDelivery(req,res,next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.communications WHERE id=$1`,[req.params.id]);
    const saved = result.rows[0];
    if (!saved) return res.status(404).json({error:"Message not found."});
    if (!saved.providerMessageId || saved.status!=="Accepted") return res.status(409).json({error:"Delivery can only be checked for a message accepted by Brevo."});
    let event;
    try { event=await require("../../services/brevo").getDeliveryEvent(saved.providerMessageId,saved.recipientEmail); }
    catch { return res.status(502).json({error:"Could not read Brevo delivery events. Check settings and try again."}); }
    const updated=await pool.query(`UPDATE public.communications SET
      delivery_event=CASE WHEN $2::timestamptz IS NOT NULL AND (delivery_event_at IS NULL OR $2::timestamptz>=delivery_event_at) THEN $3 ELSE delivery_event END,
      delivery_event_at=CASE WHEN $2::timestamptz IS NOT NULL AND (delivery_event_at IS NULL OR $2::timestamptz>=delivery_event_at) THEN $2::timestamptz ELSE delivery_event_at END,
      delivery_checked_at=now() WHERE id=$1 RETURNING ${columns}`,[saved.id,event?.date||null,event?.event||null]);
    res.json({message:updated.rows[0]});
  }catch(error){next(error);}
}
module.exports = { listMessages, getMessage, createDraft, editDraft, sendMessage, checkDelivery, createDraftSchema, editDraftSchema, sendSchema };

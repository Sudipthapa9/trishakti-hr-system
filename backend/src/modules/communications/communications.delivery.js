const pool = require("../../config/db");
const brevo = require("../../services/brevo");

const messageColumns = `id, application_id AS "applicationId", offer_id AS "offerId",
  recipient_email AS "recipientEmail", recipient_name AS "recipientName",
  subject, body, status, version, provider_message_id AS "providerMessageId",
  last_error AS "lastError", created_at AS "createdAt", updated_at AS "updatedAt"`;

async function deliverMessage(id, expectedVersion, allowOffer = false) {
  const claim = await pool.query(`
    UPDATE public.communications SET status='Sending', version=version+1, last_error=NULL, updated_at=now()
    WHERE id=$1 AND version=$2 AND status IN ('Draft','Failed')
      AND strpos(subject, '{{')=0 AND strpos(body, '{{')=0
      AND (offer_id IS NULL OR $3::boolean)
    RETURNING ${messageColumns}
  `, [id, expectedVersion, allowOffer]);
  const claimed = claim.rows[0];
  if (!claimed) {
    const existing = await pool.query(`SELECT ${messageColumns} FROM public.communications WHERE id=$1`, [id]);
    const saved = existing.rows[0];
    if (!saved) return { status: 404, body: { error: "Message not found." } };
    if (saved.offerId && !allowOffer) return { status: 409, body: { error: "Manage this message from its saved offer." } };
    if (saved.status === "Accepted") return { status: 200, body: { message: saved } };
    if (saved.subject.includes("{{") || saved.body.includes("{{")) {
      return { status: 400, body: { error: "Replace all template placeholders before sending." } };
    }
    return { status: 409, body: { error: "Message changed or its send outcome needs review. Reload history before continuing." } };
  }
  let providerId;
  try {
    providerId = await brevo.sendTransactionalEmail({
      email: claimed.recipientEmail, name: claimed.recipientName,
      subject: claimed.subject, body: claimed.body,
    });
  } catch (error) {
    const status = error instanceof brevo.BrevoSendError ? error.deliveryStatus : "Unknown";
    const message = error instanceof brevo.BrevoSendError ? error.message : "Send outcome needs review in Brevo.";
    const result = await pool.query(`
      UPDATE public.communications SET status=$1, last_error=$2, updated_at=now()
      WHERE id=$3 AND status='Sending' RETURNING ${messageColumns}
    `, [status, message, claimed.id]);
    return { status: 502, body: { error: message, message: result.rows[0] } };
  }
  const result = await pool.query(`
    UPDATE public.communications SET status='Accepted', provider_message_id=$1, updated_at=now()
    WHERE id=$2 AND status='Sending' RETURNING ${messageColumns}
  `, [providerId, claimed.id]);
  return { status: 200, body: { message: result.rows[0] } };
}

module.exports = { deliverMessage, messageColumns };

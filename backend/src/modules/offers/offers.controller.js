const { z } = require("zod");
const { randomUUID } = require("node:crypto");
const { deliverMessage } = require("../communications/communications.delivery");
const pool = require("../../config/db");

const columns = `o.id, o.application_id AS "applicationId", o.position, o.currency,
  o.annual_salary::text AS "annualSalary", o.sign_on_bonus::text AS "signOnBonus",
  to_char(o.joining_date, 'YYYY-MM-DD') AS "joiningDate",
  to_char(o.expiry_date, 'YYYY-MM-DD') AS "expiryDate",
  o.benefits, o.status, o.version, o.send_status AS "sendStatus",
  to_char(o.response_date, 'YYYY-MM-DD') AS "responseDate",
  o.response_notes AS "responseNotes",
  (SELECT jsonb_build_object(
    'recordedBy', r.recorded_by, 'recordedName', r.recorded_name,
    'recordedAt', r.recorded_at
  ) FROM public.offer_responses r WHERE r.offer_id=o.id) AS "responseAudit",
  (SELECT jsonb_build_object('id', m.id, 'status', m.status,
    'lastError', m.last_error, 'providerMessageId', m.provider_message_id)
   FROM public.communications m WHERE m.offer_id=o.id) AS delivery, o.created_at AS "createdAt", o.updated_at AS "updatedAt"`;
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
    const offer = await readOffer(req.params.id);
    if (!offer) return res.status(404).json({ error: "Offer not found." });
    res.json({ offer });
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
      WHERE o.id=$8 AND o.version=$9 AND o.status='Draft' AND o.send_status IN ('NotSent','Failed')
      RETURNING ${columns}
    `, [position, currency, annualSalary, signOnBonus, joiningDate, expiryDate, benefits, req.params.id, expectedVersion]);
    if (result.rows.length) return res.json({ offer: result.rows[0] });
    const existing = await pool.query("SELECT id FROM public.offers WHERE id=$1", [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ error: "Offer not found." });
    return res.status(409).json({ error: "Offer changed or is no longer a draft. Reload before editing." });
  } catch (error) { next(error); }
}

async function readOffer(id, connection = pool) {
  const result = await connection.query(`
    SELECT ${details} FROM public.offers o
    JOIN public.applications a ON a.id=o.application_id JOIN public.jobs j ON j.id=a.job_id
    WHERE o.id=$1
  `, [id]);
  return result.rows[0];
}

async function sendOffer(req, res, next) {
  const client = await pool.connect();
  let messageId;
  let messageVersion;
  try {
    await client.query("BEGIN");
    const result = await client.query(`
      SELECT ${details}, (o.expiry_date < CURRENT_DATE) AS expired
      FROM public.offers o JOIN public.applications a ON a.id=o.application_id
      JOIN public.jobs j ON j.id=a.job_id WHERE o.id=$1 FOR UPDATE OF o
    `, [req.params.id]);
    const offer = result.rows[0];
    if (!offer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Offer not found." });
    }
    // Recover a confirmed provider acceptance if a prior final offer update failed.
    if (offer.delivery?.status === "Accepted") {
      await client.query(`
        UPDATE public.offers SET status=CASE WHEN status='Draft' THEN 'Sent' ELSE status END, send_status='Accepted', version=version+1, updated_at=now()
        WHERE id=$1 AND (send_status<>'Accepted' OR status='Draft')
      `, [offer.id]);
      await client.query("COMMIT");
      return res.json({ offer: await readOffer(offer.id, client) });
    }
    if (offer.sendStatus === "Sending" && offer.delivery?.status === "Failed") {
      await client.query("UPDATE public.offers SET send_status='Failed',version=version+1,updated_at=now() WHERE id=$1", [offer.id]);
      await client.query("COMMIT");
      return res.status(409).json({ error: "The previous send failed. Reload the offer before retrying." });
    }
    if (offer.status !== "Draft" || !["NotSent", "Failed"].includes(offer.sendStatus) ||
        offer.version !== req.body.expectedVersion) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Offer changed or its send outcome needs review. Reload before continuing." });
    }
    if (offer.expired) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "The offer has expired. Update and save its dates before sending." });
    }
    const body = [
      "Dear " + offer.candidateName + ",",
      "Trikshati Poly Packs offers you the position of " + offer.position + ".",
      "Annual base salary: " + offer.currency + " " + offer.annualSalary,
      "Sign-on bonus: " + offer.currency + " " + offer.signOnBonus,
      "Joining date: " + offer.joiningDate,
      "Offer expiry: " + offer.expiryDate,
      "Benefits:\n" + (offer.benefits || "No benefits specified."),
      "Reference: TSH-OFFER-" + offer.id,
      "Please contact our HR team to discuss this offer.",
      "Trikshati HR",
    ].join("\n\n");
    if (body.includes("{{")) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Replace template placeholders in the saved offer before sending." });
    }
    const subject = "Employment offer — Trikshati Poly Packs";
    if (offer.delivery) {
      const message = await client.query(`
        UPDATE public.communications SET subject=$1, body=$2,
          recipient_email=$3, recipient_name=$4, status='Draft',
          version=version+1, last_error=NULL, updated_at=now()
        WHERE id=$5 AND status IN ('Draft','Failed') RETURNING id,version
      `, [subject, body, offer.candidateEmail, offer.candidateName, offer.delivery.id]);
      if (!message.rows.length) {
        await client.query("ROLLBACK");
        return res.status(409).json({ error: "Review this offer's communication history before sending." });
      }
      messageId = message.rows[0].id;
      messageVersion = message.rows[0].version;
    } else {
      messageId = randomUUID();
      const message = await client.query(`
        INSERT INTO public.communications(id,application_id,offer_id,recipient_email,recipient_name,subject,body,created_by)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING version
      `, [messageId, offer.applicationId, offer.id, offer.candidateEmail, offer.candidateName, subject, body, req.auth.sub]);
      messageVersion = message.rows[0].version;
    }
    await client.query("UPDATE public.offers SET send_status='Sending',version=version+1,updated_at=now() WHERE id=$1", [offer.id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }

  try {
    const outcome = await deliverMessage(messageId, messageVersion, true);
    const state = outcome.body.message?.status ?? "Unknown";
    await pool.query(`
      UPDATE public.offers SET send_status=$1,
        status=CASE WHEN $1='Accepted' AND status='Draft' THEN 'Sent' ELSE status END, updated_at=now()
      WHERE id=$2 AND send_status='Sending'
    `, [state, req.params.id]);
    res.status(outcome.status).json({ ...outcome.body, offer: await readOffer(req.params.id) });
  } catch (error) {
    // Leave Sending if provider acceptance cannot be persisted. Never resend blindly.
    next(error);
  }
}

async function recordOfferResponse(req, res, next) {
  const { outcome, responseDate, notes, expectedVersion } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`
      SELECT ${columns},
        to_char(now() AT TIME ZONE 'Asia/Kathmandu', 'YYYY-MM-DD') AS today,
        (SELECT to_char(m.updated_at AT TIME ZONE 'Asia/Kathmandu', 'YYYY-MM-DD')
          FROM public.communications m WHERE m.offer_id=o.id AND m.status='Accepted') AS "sentOn"
      FROM public.offers o WHERE o.id=$1 FOR UPDATE OF o
    `, [req.params.id]);
    const offer = result.rows[0];
    if (!offer) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Offer not found." });
    }
    if (offer.status === outcome && offer.responseDate === responseDate && offer.responseNotes === notes) {
      await client.query("COMMIT");
      return res.json({ offer: await readOffer(offer.id, client) });
    }
    if (offer.status !== "Sent" || offer.sendStatus !== "Accepted" ||
        offer.version !== expectedVersion || !offer.sentOn) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Offer changed, has a final response, or has not been sent. Reload before continuing." });
    }
    if (responseDate > offer.today || responseDate < offer.sentOn ||
        (outcome === "Accepted" && responseDate > offer.expiryDate)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Response date must be between sending and today. Acceptance must be within the offer expiry date." });
    }
    await client.query(`
      INSERT INTO public.offer_responses (
        offer_id,outcome,response_date,notes,recorded_by,recorded_name
      ) VALUES($1,$2,$3,$4,$5,$6)
    `, [offer.id,outcome,responseDate,notes,req.auth.sub,req.auth.preferred_username || req.auth.sub]);
    await client.query(`
      UPDATE public.offers SET status=$1,response_date=$2,response_notes=$3,
        version=version+1,updated_at=now() WHERE id=$4
    `, [outcome,responseDate,notes,offer.id]);
    await client.query("COMMIT");
    return res.json({ offer: await readOffer(offer.id, client) });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

module.exports = { listOffers, getOffer, createOffer, updateOffer, sendOffer, recordOfferResponse };

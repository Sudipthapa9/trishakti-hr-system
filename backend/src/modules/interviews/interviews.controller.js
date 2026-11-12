const { z } = require("zod");
const pool = require("../../config/db");
const columns = `i.id, i.application_id AS "applicationId", i.starts_at AS "startsAt", i.ends_at AS "endsAt",
  i.interviewer,i.meeting_url AS "meetingUrl",i.location,i.notes,i.status,i.version,
  a.full_name AS "candidateName",a.email,j.title AS "jobTitle"`;
const joins = `FROM public.interviews i JOIN public.applications a ON a.id=i.application_id JOIN public.jobs j ON j.id=a.job_id`;
async function list(req, res, next) {
  const query = z
    .object({
      page: z.coerce.number().int().min(1).max(100000).default(1),
      date: z.iso.date().optional(),
    })
    .safeParse(req.query);
  if (!query.success)
    return res.status(400).json({ error: "Invalid interview filters." });
  try {
    const result = await pool.query(
      `SELECT ${columns} ${joins}
      WHERE ($1::date IS NULL OR (i.starts_at AT TIME ZONE 'Asia/Kathmandu')::date=$1::date)
      ORDER BY i.starts_at DESC,i.id DESC LIMIT 21 OFFSET $2`,
      [query.data.date || null, (query.data.page - 1) * 20],
    );
    res.json({
      interviews: result.rows.slice(0, 20),
      hasMore: result.rows.length > 20,
    });
  } catch (error) {
    next(error);
  }
}
async function get(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT ${columns} ${joins} WHERE i.id=$1`,
      [req.params.id],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Interview not found." });
    res.json({ interview: result.rows[0] });
  } catch (error) {
    next(error);
  }
}
async function create(req, res, next) {
  const b = req.body;
  try {
    if (new Date(b.startsAt) <= new Date())
      return res.status(400).json({ error: "Schedule a future interview." });
    const result = await pool.query(
      `INSERT INTO public.interviews(id,application_id,starts_at,ends_at,interviewer,meeting_url,location,notes,created_by,updated_by)
      SELECT $1,a.id,$3,$4,$5,$6,$7,$8,$9,$9 FROM public.applications a WHERE a.id=$2 AND a.stage NOT IN ('Rejected','Withdrawn','Hired')
      ON CONFLICT (id) DO NOTHING RETURNING id`,
      [
        b.id,
        b.applicationId,
        b.startsAt,
        b.endsAt,
        b.interviewer,
        b.meetingUrl,
        b.location,
        b.notes,
        req.auth.sub,
      ],
    );
    if (!result.rows.length) {
      const existing = await pool.query(
        `SELECT id FROM public.interviews WHERE id=$1 AND application_id=$2 AND starts_at=$3 AND ends_at=$4 AND interviewer=$5 AND meeting_url=$6 AND location=$7 AND notes=$8`,
        [
          b.id,
          b.applicationId,
          b.startsAt,
          b.endsAt,
          b.interviewer,
          b.meetingUrl,
          b.location,
          b.notes,
        ],
      );
      if (!existing.rows.length)
        return res
          .status(409)
          .json({
            error:
              "Application is not eligible or this interview reference has changed.",
          });
    }
    req.params.id = b.id;
    res.status(result.rows.length ? 201 : 200);
    return get(req, res, next);
  } catch (error) {
    next(error);
  }
}
async function update(req, res, next) {
  const b = req.body;
  let client;
  try {
    if (new Date(b.startsAt) <= new Date())
      return res.status(400).json({ error: "Reschedule to a future time." });
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(
      "SELECT id FROM public.interviews WHERE id=$1 FOR UPDATE",
      [req.params.id],
    );
    const sending = await client.query(
      "SELECT id FROM public.communications WHERE interview_id=$1 AND status='Sending'",
      [req.params.id],
    );
    if (sending.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error:
            "A notification is being sent. Confirm its outcome before rescheduling.",
        });
    }
    const result = await client.query(
      `UPDATE public.interviews SET starts_at=$1,ends_at=$2,interviewer=$3,meeting_url=$4,location=$5,notes=$6,version=version+1,updated_at=now(),updated_by=$7
      WHERE id=$8 AND version=$9 AND status='Scheduled' RETURNING id`,
      [
        b.startsAt,
        b.endsAt,
        b.interviewer,
        b.meetingUrl,
        b.location,
        b.notes,
        req.auth.sub,
        req.params.id,
        b.expectedVersion,
      ],
    );
    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error: "Interview changed or is no longer scheduled. Reload first.",
        });
    }
    await client.query("COMMIT");
    client.release();
    client = null;
    return get(req, res, next);
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    if (client) client.release();
  }
}
async function status(req, res, next) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query(
      "SELECT id FROM public.interviews WHERE id=$1 FOR UPDATE",
      [req.params.id],
    );
    const sending = await client.query(
      "SELECT id FROM public.communications WHERE interview_id=$1 AND status='Sending'",
      [req.params.id],
    );
    if (sending.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error:
            "A notification is being sent. Confirm its outcome before changing the schedule.",
        });
    }
    const result = await client.query(
      `UPDATE public.interviews SET status=$1,version=version+1,updated_at=now(),updated_by=$2
      WHERE id=$3 AND version=$4 AND status='Scheduled' AND ($1='Cancelled' OR ends_at<=now()) RETURNING id`,
      [req.body.status, req.auth.sub, req.params.id, req.body.expectedVersion],
    );
    if (!result.rows.length) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error:
            "Reload the interview. Only a scheduled interview can change status, and completion requires its end time to have passed.",
        });
    }
    await client.query("COMMIT");
    client.release();
    client = null;
    return get(req, res, next);
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    if (client) client.release();
  }
}
async function notification(req, res, next) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT ${columns} ${joins} WHERE i.id=$1 FOR UPDATE OF i`,
      [req.params.id],
    );
    const i = result.rows[0];
    if (
      !i ||
      i.version !== req.body.expectedVersion ||
      i.status === "Completed"
    ) {
      await client.query("ROLLBACK");
      return res
        .status(409)
        .json({
          error: "Reload the saved interview before preparing a notification.",
        });
    }
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kathmandu",
      dateStyle: "full",
      timeStyle: "short",
    });
    const subject = (
      (i.status === "Cancelled"
        ? "Interview cancelled"
        : "Interview schedule") +
      " — " +
      i.jobTitle
    ).slice(0, 200);
    const body = `Hi ${i.candidateName},\n\n${i.status === "Cancelled" ? "Your interview has been cancelled." : "Your interview is scheduled as follows:"}\nPosition: ${i.jobTitle}\nStart: ${time.format(new Date(i.startsAt))}\nEnd: ${time.format(new Date(i.endsAt))}\nTime zone: Asia/Kathmandu\nInterviewer: ${i.interviewer}\n${i.meetingUrl ? "Meeting link: " + i.meetingUrl : ""}\n${i.location ? "Location: " + i.location : ""}\n\nPlease contact HR with any questions.\nTrishakti HR`;
    const saved = await client.query(
      `INSERT INTO public.communications(id,application_id,recipient_email,recipient_name,subject,body,created_by,interview_id,interview_version)
      VALUES(gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(interview_id,interview_version) DO NOTHING RETURNING id`,
      [
        i.applicationId,
        i.email,
        i.candidateName,
        subject,
        body,
        req.auth.sub,
        i.id,
        i.version,
      ],
    );
    const existing = saved.rows.length
      ? saved
      : await client.query(
          "SELECT id FROM public.communications WHERE interview_id=$1 AND interview_version=$2",
          [i.id, i.version],
        );
    await client.query("COMMIT");
    res.json({ messageId: existing.rows[0].id });
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    next(error);
  } finally {
    if (client) client.release();
  }
}
module.exports = { list, get, create, update, status, notification };

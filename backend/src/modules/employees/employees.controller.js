const { z } = require("zod");
const pool = require("../../config/db");
const columns = `id, onboarding_id AS "onboardingId", candidate_id AS "candidateId",
  application_id AS "applicationId", full_name AS "fullName", email, phone,
  position, department, location, to_char(joining_date,'YYYY-MM-DD') AS "joiningDate",
  created_at AS "createdAt", created_by AS "createdBy", version,
  updated_at AS "updatedAt",updated_by AS "updatedBy",
  emergency_name AS "emergencyName",emergency_relationship AS "emergencyRelationship",emergency_phone AS "emergencyPhone"`;
async function list(req, res, next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({ error: "Invalid page." });
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.employees ORDER BY created_at DESC,id DESC LIMIT 21 OFFSET $1`, [(page.data - 1) * 20]);
    res.json({ employees: result.rows.slice(0, 20), hasMore: result.rows.length > 20 });
  } catch (error) { next(error); }
}
async function get(req, res, next) {
  try {
    const result = await pool.query(`SELECT ${columns} FROM public.employees WHERE id=$1`, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: "Employee record not found." });
    res.json({ employee: result.rows[0] });
  } catch (error) { next(error); }
}

async function update(req, res, next) {
  let client;
  try {
    client = await pool.connect(); await client.query("BEGIN");
    const previous = await client.query(`SELECT ${columns} FROM public.employees WHERE id=$1 FOR UPDATE`, [req.params.id]);
    const employee = previous.rows[0];
    if (!employee || employee.version !== req.body.expectedVersion) {
      await client.query("ROLLBACK"); return res.status(employee ? 409 : 404).json({ error: employee ? "Record changed. Reload before editing." : "Employee not found." });
    }
    const b = req.body;
    const saved = await client.query(`UPDATE public.employees SET full_name=$1,email=$2,phone=$3,position=$4,department=$5,location=$6,
      emergency_name=$7,emergency_relationship=$8,emergency_phone=$9,version=version+1,updated_at=now(),updated_by=$10 WHERE id=$11 RETURNING ${columns}`,
    [b.fullName,b.email,b.phone,b.position,b.department,b.location,b.emergencyName,b.emergencyRelationship,b.emergencyPhone,req.auth.sub,employee.id]);
    await client.query("INSERT INTO public.employee_changes(employee_id,changed_by,previous_values,new_values) VALUES($1,$2,$3,$4)", [employee.id,req.auth.sub,JSON.stringify(employee),JSON.stringify(saved.rows[0])]);
    await client.query("COMMIT"); res.json({ employee: saved.rows[0] });
  } catch (error) { if (client) await client.query("ROLLBACK").catch(() => {}); next(error); }
  finally { if (client) client.release(); }
}
async function history(req,res,next) {
  const page = z.coerce.number().int().min(1).max(100000).safeParse(req.query.page ?? 1);
  if (!page.success) return res.status(400).json({error:"Invalid page."});
  try {
    const result = await pool.query(`SELECT id,changed_by AS "changedBy",changed_at AS "changedAt",previous_values AS "previousValues",new_values AS "newValues"
      FROM public.employee_changes WHERE employee_id=$1 ORDER BY changed_at DESC,id DESC LIMIT 21 OFFSET $2`,[req.params.id,(page.data-1)*20]);
    res.json({changes:result.rows.slice(0,20),hasMore:result.rows.length>20});
  } catch(error) { next(error); }
}
module.exports = { list, get, update, history };

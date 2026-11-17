const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});
const pool = require("../src/config/db");
const batch = "trishakti-demo-2026-11-v1";
function stableId(label) {
  const b = createHash("sha256")
    .update(batch + ":" + label)
    .digest()
    .subarray(0, 16);
  b[6] = (b[6] & 15) | 64;
  b[8] = (b[8] & 63) | 128;
  const h = b.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const jobIds = Array.from({ length: 5 }, (_, i) => stableId("job-" + i));
const seededApps = Array.from({ length: 30 }, (_, i) =>
  stableId("application-" + i),
);
const seededCandidates = Array.from({ length: 20 }, (_, i) =>
  stableId("candidate-" + i),
);
const restoreOrder = [
  "jobs",
  "candidates",
  "applications",
  "application_resumes",
  "offers",
  "offer_responses",
  "onboarding",
  "employees",
  "employee_changes",
  "interviews",
  "communications",
  "onboarding_documents",
];
const deleteOrder = [
  "employee_changes",
  "onboarding_documents",
  "communications",
  "employees",
  "onboarding",
  "offer_responses",
  "offers",
  "interviews",
  "application_resumes",
  "applications",
  "candidates",
  "jobs",
];
async function main() {
  if (
    !["--inspect", "--apply-including-manual-tests"].includes(process.argv[2])
  )
    throw new Error(
      "Use --inspect, or --apply-including-manual-tests only after confirming the linked manual entries are test data.",
    );
  const client = await pool.connect();
  let committed = false;
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query(
      "LOCK TABLE " +
        restoreOrder.map((t) => "public." + t).join(",") +
        " IN SHARE ROW EXCLUSIVE MODE",
    );
    const data = {};
    const read = async (table, where, values) => {
      const r = await client.query(
        `SELECT * FROM public.${table} WHERE ${where}`,
        values,
      );
      data[table] = r.rows;
      return r.rows;
    };
    const jobs = await read("jobs", "id=ANY($1::uuid[])", [jobIds]);
    if (
      jobs.some(
        (j) =>
          !j.title.startsWith("Demo - ") ||
          !j.description?.startsWith("DEMO DATA ONLY."),
      )
    )
      throw new Error("Seed job markers changed; cleanup stopped.");
    const apps = await read(
      "applications",
      "job_id=ANY($1::uuid[]) OR id=ANY($2::uuid[])",
      [jobIds, seededApps],
    );
    const appsIds = apps.map((a) => a.id);
    const candidatesIds = [
      ...new Set([...seededCandidates, ...apps.map((a) => a.candidate_id)]),
    ];
    await read(
      "candidates",
      "id=ANY($1::uuid[]) AND NOT EXISTS(SELECT 1 FROM applications a WHERE a.candidate_id=candidates.id AND NOT(a.id=ANY($2::uuid[]))) AND NOT EXISTS(SELECT 1 FROM employees e WHERE e.candidate_id=candidates.id AND NOT(e.application_id=ANY($2::uuid[])))",
      [candidatesIds, appsIds],
    );
    await read("application_resumes", "application_id=ANY($1::uuid[])", [
      appsIds,
    ]);
    const offers = await read("offers", "application_id=ANY($1::uuid[])", [
      appsIds,
    ]);
    const offersIds = offers.map((o) => o.id);
    await read("offer_responses", "offer_id=ANY($1::uuid[])", [offersIds]);
    const onboard = await read("onboarding", "offer_id=ANY($1::uuid[])", [
      offersIds,
    ]);
    const onboardIds = onboard.map((o) => o.id);
    const employees = await read(
      "employees",
      "application_id=ANY($1::uuid[]) OR onboarding_id=ANY($2::uuid[])",
      [appsIds, onboardIds],
    );
    await read("employee_changes", "employee_id=ANY($1::uuid[])", [
      employees.map((e) => e.id),
    ]);
    const interviews = await read(
      "interviews",
      "application_id=ANY($1::uuid[])",
      [appsIds],
    );
    await read(
      "communications",
      "application_id=ANY($1::uuid[]) OR offer_id=ANY($2::uuid[]) OR interview_id=ANY($3::uuid[])",
      [appsIds, offersIds, interviews.map((i) => i.id)],
    );
    await read("onboarding_documents", "onboarding_id=ANY($1::uuid[])", [
      onboardIds,
    ]);
    const counts = Object.fromEntries(
      restoreOrder.map((t) => [t, data[t].length]),
    );
    if (process.argv[2] === "--inspect") {
      await client.query("ROLLBACK");
      console.log(JSON.stringify({ batch, mode: "read-only", counts }));
      return;
    }
    const directory = path.resolve(
      __dirname,
      "../../private/mock-cleanup",
      new Date().toISOString().replace(/[:.]/g, "-"),
    );
    const privateRoot = path.resolve(__dirname, "../../private") + path.sep;
    if (!directory.startsWith(privateRoot))
      throw new Error("Invalid backup directory.");
    fs.mkdirSync(directory, { recursive: true });
    const backup = {
      batch,
      createdAt: new Date().toISOString(),
      restoreOrder,
      data,
    };
    const file = path.join(directory, "database-backup.json");
    fs.writeFileSync(file, JSON.stringify(backup));
    const checked = JSON.parse(fs.readFileSync(file, "utf8"));
    if (restoreOrder.some((t) => checked.data[t].length !== counts[t]))
      throw new Error("Backup validation failed.");
    const before = {};
    for (const table of restoreOrder)
      before[table] = Number(
        (await client.query(`SELECT count(*) AS n FROM public.${table}`))
          .rows[0].n,
      );
    for (const table of deleteOrder) {
      if (!data[table].length) continue;
      const key = table === "application_resumes" ? "application_id" : "id";
      const ids = data[table].map((row) => row[key]);
      const result = await client.query(
        `DELETE FROM public.${table} WHERE ${key}=ANY($1::uuid[])`,
        [ids],
      );
      if (result.rowCount !== counts[table])
        throw new Error("Deletion count mismatch for " + table);
    }
    const remaining = {};
    for (const table of restoreOrder) {
      remaining[table] = Number(
        (await client.query(`SELECT count(*) AS n FROM public.${table}`))
          .rows[0].n,
      );
      if (remaining[table] !== before[table] - counts[table])
        throw new Error("Preservation check failed for " + table);
    }
    await client.query("COMMIT");
    committed = true;
    fs.writeFileSync(
      path.join(directory, "cleanup-result.json"),
      JSON.stringify(
        {
          batch,
          removed: counts,
          remaining,
          backup: path.relative(path.resolve(__dirname, "../.."), file),
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        batch,
        removed: counts,
        remaining,
        backup: path.relative(path.resolve(__dirname, "../.."), file),
      }),
    );
  } catch (error) {
    if (!committed) await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
main()
  .catch((error) => {
    console.error(
      "Mock cleanup failed (" + (error.code || error.message) + ").",
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());

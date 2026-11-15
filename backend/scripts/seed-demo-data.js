/**
 * Explicit development seed. Uses synthetic identities only, preserves existing
 * records on retries, and never sends mail or changes Keycloak permissions.
 * Run --prepare, generate the PDFs, then --apply. See private docs for details.
 */
const path = require("node:path");
const fs = require("node:fs");
const { createHash } = require("node:crypto");
require("dotenv").config({
  path: path.join(__dirname, "../.env"),
  quiet: true,
});
const { createJobSchema } = require("../src/modules/jobs/jobs.schema");
const {
  applicationSchema,
} = require("../src/modules/applications/applications.schema");
const {
  validateResume,
} = require("../src/modules/applications/resume-validation");

const batch = "trishakti-demo-2026-11-v1";
const directory = path.resolve(__dirname, "../../private/demo-seed", batch);
// Stable UUIDs make repeating this named batch safe without changing real data.
function id(label) {
  const bytes = createHash("sha256")
    .update(batch + ":" + label)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 0x40;
  bytes[8] = (bytes[8] & 63) | 0x80;
  const h = bytes.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
const specifications = [
  [
    "HR Officer",
    "Human Resources",
    "Hetauda",
    "Full-time",
    ["Recruitment", "HR Documentation", "Communication"],
    ["Excel", "Onboarding"],
  ],
  [
    "Frontend Developer",
    "Information Technology",
    "Remote",
    "Full-time",
    ["React", "TypeScript", "CSS"],
    ["Accessibility", "Git"],
  ],
  [
    "Accounts Assistant",
    "Finance",
    "Kathmandu",
    "Full-time",
    ["Bookkeeping", "Excel", "Reconciliation"],
    ["Payroll", "Reporting"],
  ],
  [
    "Production Supervisor",
    "Operations",
    "Hetauda",
    "Full-time",
    ["Production Planning", "Quality Control", "Team Coordination"],
    ["Safety", "Inventory"],
  ],
  [
    "Marketing Intern",
    "Marketing",
    "Lalitpur",
    "Internship",
    ["Content Writing", "Social Media", "Research"],
    ["Canva", "Analytics"],
  ],
];
const names = [
  "Aarav Sharma",
  "Sita Karki",
  "Nabin Adhikari",
  "Maya Gurung",
  "Rohan Shrestha",
  "Anita Thapa",
  "Bikash Rai",
  "Puja Pandey",
  "Suman Tamang",
  "Nisha Basnet",
  "Kiran Joshi",
  "Pratima Bhandari",
  "Roshan Lama",
  "Sarita Acharya",
  "Deepak Magar",
  "Manisha Khadka",
  "Prakash Dahal",
  "Rita Poudel",
  "Sanjay Nepal",
  "Bina Shahi",
];
const jobs = specifications.map(
  (
    [title, department, location, employmentType, skills, preferred],
    index,
  ) => ({
    id: id("job-" + index),
    ...createJobSchema.parse({
      title: "Demo - " + title,
      department,
      location,
      employmentType,
      description: `DEMO DATA ONLY. This fictional ${title} role is provided to explore the Trishakti HR interface. It is not a real vacancy. The role involves ${skills.join(", ").toLowerCase()}.`,
      responsibilities: skills
        .map(
          (skill) =>
            "- Support " +
            skill.toLowerCase() +
            " activities in this fictional demo role.",
        )
        .join("\n"),
      closingDate: "2026-12-31",
      vacancies: index === 3 ? 2 : 1,
      shortlistMultiplier: 5,
      requiredSkills: skills.map((name, n) => ({ name, weight: 5 - n })),
      preferredSkills: preferred.map((name) => ({ name, weight: 2 })),
    }),
  }),
);
const candidates = names.map((name, index) => ({
  id: id("candidate-" + index),
  fullName: "Demo " + name,
  email: `candidate${String(index + 1).padStart(2, "0")}@trishakti-demo.invalid`,
  // Reserved fictional North American phone range; not a real Nepali contact.
  phone: "+1 202-555-" + String(101 + index).padStart(4, "0"),
  profile: specifications[index % 5][0],
  skills: [...specifications[index % 5][4], ...specifications[index % 5][5]],
  experienceYears: index % 5,
  cvName: `demo-candidate-${String(index + 1).padStart(2, "0")}-cv.pdf`,
}));
const stages = [
  "Review",
  "Review",
  "Screening",
  "Shortlisted",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];
const applications = Array.from({ length: 30 }, (_, index) => {
  const person = candidates[index % 20];
  const job = jobs[index < 20 ? index % 5 : ((index % 5) + 1) % 5];
  return {
    ...applicationSchema.parse({
      requestId: id("application-" + index),
      jobId: job.id,
      fullName: person.fullName,
      email: person.email,
      phone: person.phone,
      coverLetter: `DEMO DATA ONLY - fictional application ${index + 1} for ${job.title}. This record and its CV are for interface practice. Skills: ${person.skills.join(", ")}. Do not contact this synthetic applicant.`,
    }),
    candidateId: person.id,
    cvName: person.cvName,
    stage: stages[index % stages.length],
    daysAgo: 29 - index,
  };
});

async function main() {
  const mode = process.argv[2];
  if (!["--prepare", "--apply"].includes(mode))
    throw new Error(
      "Use --prepare to write demo metadata, or --apply after generating the CV files. No data was changed.",
    );
  fs.mkdirSync(directory, { recursive: true });
  const manifestPath = path.join(directory, "manifest.json");
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ batch, jobs, candidates, applications }, null, 2),
  );
  if (mode === "--prepare") {
    console.log(
      "Prepared synthetic metadata: 5 jobs, 20 candidates, 30 applications.",
    );
    console.log("Manifest: " + manifestPath);
    return;
  }
  // Validate all files before starting any database mutation.
  const files = new Map();
  for (const person of candidates) {
    const buffer = fs.readFileSync(path.join(directory, person.cvName));
    const file = { buffer, size: buffer.length, originalname: person.cvName };
    await validateResume(file);
    files.set(person.cvName, buffer);
  }
  const pool = require("../src/config/db");
  let client;
  const inserted = { jobs: 0, candidates: 0, applications: 0, resumeCopies: 0 };
  try {
    client = await pool.connect();
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      batch,
    ]);
    for (const job of jobs) {
      const result = await client.query(
        `INSERT INTO public.jobs(id,title,department,location,employment_type,description,status,closing_date,responsibilities,required_skills,preferred_skills,vacancies,shortlist_multiplier)
        VALUES($1,$2,$3,$4,$5,$6,'Open',$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO NOTHING RETURNING id`,
        [
          job.id,
          job.title,
          job.department,
          job.location,
          job.employmentType,
          job.description,
          job.closingDate,
          job.responsibilities,
          JSON.stringify(job.requiredSkills),
          JSON.stringify(job.preferredSkills),
          job.vacancies,
          job.shortlistMultiplier,
        ],
      );
      inserted.jobs += result.rowCount;
    }
    for (const person of candidates) {
      const result = await client.query(
        `INSERT INTO public.candidates(id,full_name,email,phone,created_at)
        VALUES($1,$2,$3,$4,now()-make_interval(days=>$5)) ON CONFLICT(id) DO NOTHING RETURNING id`,
        [
          person.id,
          person.fullName,
          person.email,
          person.phone,
          19 - candidates.indexOf(person),
        ],
      );
      inserted.candidates += result.rowCount;
      const saved = await client.query(
        "SELECT email FROM public.candidates WHERE id=$1",
        [person.id],
      );
      if (saved.rows[0]?.email !== person.email)
        throw new Error(
          "Demo identifier collision. No records were overwritten.",
        );
    }
    for (const application of applications) {
      const buffer = files.get(application.cvName);
      const fileHash = createHash("sha256").update(buffer).digest("hex");
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify([
            application.jobId,
            application.fullName,
            application.email,
            application.phone,
            application.coverLetter,
            fileHash,
          ]),
        )
        .digest("hex");
      const result = await client.query(
        `INSERT INTO public.applications(id,candidate_id,job_id,full_name,email,phone,cover_letter,stage,resume_storage_key,resume_original_name,resume_media_type,resume_size_bytes,submission_hash,created_at,updated_at)
        VALUES($1::uuid,$2,$3,$4,$5,$6,$7,$8,($1::uuid)::text,$9,'application/pdf',$10,$11,now()-make_interval(days=>$12),now()-make_interval(days=>$12))
        ON CONFLICT(id) DO NOTHING RETURNING id`,
        [
          application.requestId,
          application.candidateId,
          application.jobId,
          application.fullName,
          application.email,
          application.phone,
          application.coverLetter,
          application.stage,
          application.cvName,
          buffer.length,
          fingerprint,
          application.daysAgo,
        ],
      );
      inserted.applications += result.rowCount;
      if (result.rowCount) {
        await client.query(
          "INSERT INTO public.application_resumes(application_id,content) VALUES($1,$2)",
          [application.requestId, buffer],
        );
        inserted.resumeCopies++;
      }
    }
    const summary = await client.query(
      `SELECT
      (SELECT count(*)::int FROM public.jobs WHERE id=ANY($1::uuid[])) AS jobs,
      (SELECT count(*)::int FROM public.candidates WHERE id=ANY($2::uuid[])) AS candidates,
      (SELECT count(*)::int FROM public.applications WHERE id=ANY($3::uuid[])) AS applications,
      (SELECT count(*)::int FROM public.application_resumes WHERE application_id=ANY($3::uuid[])) AS resumes`,
      [
        jobs.map((j) => j.id),
        candidates.map((c) => c.id),
        applications.map((a) => a.requestId),
      ],
    );
    const counts = summary.rows[0];
    if (
      counts.jobs !== 5 ||
      counts.candidates !== 20 ||
      counts.applications !== 30 ||
      counts.resumes !== 30
    )
      throw new Error("Demo batch count mismatch; rolling back.");
    await client.query("COMMIT");
    fs.writeFileSync(
      path.join(directory, "seed-result.json"),
      JSON.stringify({ batch, inserted, total: counts }, null, 2),
    );
    console.log(JSON.stringify({ batch, inserted, total: counts }));
  } catch (error) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    // Do not include connection strings or raw database detail in CLI output.
    throw new Error(
      error.code
        ? "Demo seed failed (" +
            error.code +
            "). Database transaction rolled back."
        : error.message,
    );
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

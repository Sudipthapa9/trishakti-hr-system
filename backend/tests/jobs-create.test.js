const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const {
  createJobSchema,
  updateJobSchema,
} = require("../src/modules/jobs/jobs.schema");
const { createJob } = require("../src/modules/jobs/jobs.controller");

const fields = {
  title: "HR Assistant",
  department: "Human Resources",
  location: "Hetauda",
  employmentType: "Full-time",
  description: "Support the recruitment team.",
};

test("job creation accepts Draft/Open, preserves validation, and rejects Archived", () => {
  assert.equal(createJobSchema.safeParse(fields).success, true);
  for (const status of ["Draft", "Open"]) {
    assert.equal(createJobSchema.parse({ ...fields, status }).status, status);
  }
  assert.equal(
    createJobSchema.safeParse({ ...fields, status: "Archived" }).success,
    false,
  );
  assert.equal(
    createJobSchema.safeParse({ ...fields, title: " ", status: "Open" })
      .success,
    false,
  );
  assert.equal(updateJobSchema.safeParse({ status: "Archived" }).success, true);
});

test("creation saves the requested status in one insert, defaulting older clients to Draft", async () => {
  const originalQuery = pool.query;
  try {
    for (const requested of [undefined, "Draft", "Open"]) {
      let calls = 0;
      const expected = requested ?? "Draft";
      pool.query = async (sql, values) => {
        calls++;
        assert.match(sql, /INSERT INTO public\.jobs/);
        assert.match(sql, /\$12/);
        assert.equal(values[11], expected);
        return { rows: [{ id: "saved-job", ...fields, status: expected }] };
      };
      let response;
      const res = {
        status(code) {
          assert.equal(code, 201);
          return this;
        },
        json(value) {
          response = value;
        },
      };
      await createJob(
        { body: { ...fields, ...(requested ? { status: requested } : {}) } },
        res,
        (error) => {
          throw error;
        },
      );
      assert.equal(response.job.status, expected);
      assert.equal(calls, 1);
    }
    const failure = new Error("Database unavailable");
    pool.query = async () => {
      throw failure;
    };
    let forwarded;
    await createJob({ body: fields }, {}, (error) => {
      forwarded = error;
    });
    assert.equal(forwarded, failure);
  } finally {
    pool.query = originalQuery;
  }
});

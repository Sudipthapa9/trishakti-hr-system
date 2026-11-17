const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const {
  listApplications,
} = require("../src/modules/applications/applications.controller");
function response() {
  return {
    code: 200,
    body: null,
    status(code) {
      this.code = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
test("application search and stage combine with the job filter before paging", async () => {
  const original = pool.query;
  const jobId = randomUUID();
  try {
    pool.query = async (sql, values) => {
      assert.ok(sql.indexOf("a.stage = $3") < sql.indexOf("LIMIT 21"));
      assert.ok(sql.indexOf("strpos(lower(a.email)") < sql.indexOf("LIMIT 21"));
      assert.ok(sql.includes("strpos(lower(j.title)"));
      assert.deepEqual(values, [20, jobId, "Shortlisted", "100%_ HR"]);
      assert.ok(!sql.includes("100%_ HR"));
      return { rows: Array.from({ length: 21 }, (_, id) => ({ id })) };
    };
    const res = response();
    await listApplications(
      { query: { page: "2", jobId, stage: "Shortlisted", q: " 100%_ HR " } },
      res,
      (error) => {
        throw error;
      },
    );
    assert.equal(res.body.applications.length, 20);
    assert.equal(res.body.hasMore, true);
    pool.query = async () => {
      throw new Error("Invalid input must not reach SQL");
    };
    for (const query of [
      { stage: "NotAStage" },
      { stage: ["Review", "Offer"] },
      { q: ["name"] },
      { q: "x".repeat(201) },
    ]) {
      const invalid = response();
      await listApplications({ query }, invalid, (error) => {
        throw error;
      });
      assert.equal(invalid.code, 400);
    }
  } finally {
    pool.query = original;
  }
});

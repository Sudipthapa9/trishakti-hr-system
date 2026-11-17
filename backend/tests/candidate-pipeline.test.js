const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const pool = require("../src/config/db");
const app = require("../src/app");
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

test("pipeline filters by a validated job before paging and retains unfiltered access", async () => {
  const original = pool.query;
  const jobId = randomUUID();
  try {
    let calls = 0;
    pool.query = async (sql, values) => {
      calls++;
      assert.match(sql, /WHERE \(\$2::uuid IS NULL OR a\.job_id = \$2::uuid\)/);
      assert.deepEqual(values, [20, jobId, null, null]);
      return {
        rows: Array.from({ length: 21 }, (_, index) => ({ id: index, jobId })),
      };
    };
    const filtered = response();
    await listApplications(
      { query: { page: "2", jobId } },
      filtered,
      (error) => {
        throw error;
      },
    );
    assert.equal(filtered.body.applications.length, 20);
    assert.equal(filtered.body.hasMore, true);
    assert.equal(calls, 1);

    pool.query = async (_, values) => {
      assert.deepEqual(values, [0, null, null, null]);
      return { rows: [] };
    };
    const unfiltered = response();
    await listApplications({ query: {} }, unfiltered, (error) => {
      throw error;
    });
    assert.deepEqual(unfiltered.body, { applications: [], hasMore: false });

    pool.query = async () => {
      throw new Error("Invalid queries must not reach the database");
    };
    for (const query of [
      { jobId: "invalid" },
      { jobId: [jobId, jobId] },
      { page: "0" },
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

test("staff candidate upload requires authentication before parsing the upload", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const result = await fetch(
      `http://127.0.0.1:${server.address().port}/api/applications/internal`,
      {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=invalid" },
        body: "invalid multipart",
      },
    );
    assert.equal(result.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

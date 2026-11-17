const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../src/config/db");
const { list } = require("../src/modules/interviews/interviews.controller");
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
test("interview date and status filters run before pagination and reject invalid queries", async () => {
  const original = pool.query;
  try {
    pool.query = async (sql, values) => {
      assert.match(sql, /ANY\(\$3::text\[\]\)/);
      assert.ok(sql.indexOf("ANY") < sql.indexOf("LIMIT 21"));
      assert.deepEqual(values, ["2026-11-16", 20, ["Scheduled", "Completed"]]);
      return { rows: Array.from({ length: 21 }, (_, id) => ({ id })) };
    };
    const filtered = response();
    await list(
      {
        query: { page: "2", date: "2026-11-16", status: "Scheduled,Completed" },
      },
      filtered,
      (error) => {
        throw error;
      },
    );
    assert.equal(filtered.body.interviews.length, 20);
    assert.equal(filtered.body.hasMore, true);
    pool.query = async (_, values) => {
      assert.deepEqual(values, [null, 0, null]);
      return { rows: [] };
    };
    const all = response();
    await list({ query: {} }, all, (error) => {
      throw error;
    });
    assert.deepEqual(all.body, { interviews: [], hasMore: false });
    pool.query = async (_, values) => {
      assert.deepEqual(values, [null, 0, []]);
      return { rows: [] };
    };
    const none = response();
    await list({ query: { status: "" } }, none, (error) => {
      throw error;
    });
    assert.equal(none.body.interviews.length, 0);
    pool.query = async () => {
      throw new Error("Invalid filters must not query the database");
    };
    for (const query of [
      { status: "Rescheduled" },
      { status: "Scheduled,Invalid" },
      { status: ["Scheduled"] },
      { date: "bad" },
      { page: "0" },
    ]) {
      const invalid = response();
      await list({ query }, invalid, (error) => {
        throw error;
      });
      assert.equal(invalid.code, 400);
    }
  } finally {
    pool.query = original;
  }
});

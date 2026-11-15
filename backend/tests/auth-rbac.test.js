const { test } = require("node:test");
const assert = require("node:assert/strict");
const requireRole = require("../src/middleware/rbac");
function run(auth, allowed) {
  let status,
    passed = false;
  requireRole(...allowed)(
    { auth },
    {
      status(code) {
        status = code;
        return this;
      },
      json() {},
    },
    () => {
      passed = true;
    },
  );
  return { status, passed };
}
test("role guard distinguishes authentication from authorization", () => {
  assert.deepEqual(run(undefined, ["hr"]), { status: 401, passed: false });
  for (const roles of [
    undefined,
    [],
    ["manager"],
    ["admin"],
    "hr",
    { includes: true },
  ]) {
    assert.deepEqual(run({ realm_access: { roles } }, ["hr", "hr-head"]), {
      status: 403,
      passed: false,
    });
  }
});
test("business roles do not implicitly grant one another", () => {
  assert.equal(
    run({ realm_access: { roles: ["hr"] } }, ["hr", "hr-head"]).passed,
    true,
  );
  assert.equal(
    run({ realm_access: { roles: ["hr-head"] } }, ["hr", "hr-head"]).passed,
    true,
  );
  assert.equal(
    run({ realm_access: { roles: ["hr"] } }, ["hr-head"]).status,
    403,
  );
  assert.equal(
    run({ realm_access: { roles: ["hr-head"] } }, ["manager"]).status,
    403,
  );
});

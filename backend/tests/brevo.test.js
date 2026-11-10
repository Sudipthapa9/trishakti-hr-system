const { test } = require("node:test");
const assert = require("node:assert/strict");
const { checkBrevoConnection } = require("../src/services/brevo");

test("Brevo configuration and read-only connection checks", async () => {
  const originalFetch = global.fetch;
  const names = ["BREVO_API_KEY", "BREVO_SENDER_EMAIL", "BREVO_SENDER_NAME"];
  const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    global.fetch = () => assert.fail("Missing settings must not make a network request");
    await assert.rejects(checkBrevoConnection, /Set BREVO_API_KEY/);
    Object.assign(process.env, {
      BREVO_API_KEY: "verification-placeholder",
      BREVO_SENDER_EMAIL: "sender@example.invalid",
      BREVO_SENDER_NAME: "Verification",
    });
    global.fetch = async (url, options) => {
      assert.equal(options.headers["api-key"], "verification-placeholder");
      assert.equal(options.method, undefined);
      assert.equal(options.redirect, "error");
      assert(options.signal instanceof AbortSignal);
      return {
        ok: true, status: 200,
        json: async () => url.endsWith("/account")
          ? { relay: { enabled: true } }
          : { senders: [{ email: "Sender@example.invalid", active: true }] },
      };
    };
    assert.deepEqual(await checkBrevoConnection(), { connected: true, senderVerified: true });
    for (const status of [401, 403, 429, 500]) {
      global.fetch = async () => ({ ok: false, status });
      await assert.rejects(checkBrevoConnection);
    }
    global.fetch = async () => { throw new Error("Network failure"); };
    await assert.rejects(checkBrevoConnection, /Could not reach/);
    global.fetch = async (url) => ({
      ok: true, status: 200,
      json: async () => url.endsWith("/account")
        ? { relay: { enabled: true } }
        : { senders: [{ email: "sender@example.invalid", active: false }] },
    });
    await assert.rejects(checkBrevoConnection, /verify/);
    global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ relay: { enabled: false } }) });
    await assert.rejects(checkBrevoConnection, /Enable transactional/);
  } finally {
    global.fetch = originalFetch;
    for (const name of names) {
      if (original[name] === undefined) delete process.env[name];
      else process.env[name] = original[name];
    }
  }
});

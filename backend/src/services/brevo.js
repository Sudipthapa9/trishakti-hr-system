const { z } = require("zod");

const configSchema = z.object({
  BREVO_API_KEY: z.string().trim().min(1),
  BREVO_SENDER_EMAIL: z.string().trim().email(),
  BREVO_SENDER_NAME: z.string().trim().min(1).max(100),
});

async function brevoGet(path, apiKey) {
  let response;
  try {
    response = await fetch("https://api.brevo.com/v3" + path, {
      headers: { "api-key": apiKey, accept: "application/json" },
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    throw new Error("Could not reach Brevo. Check your network and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error("Brevo rejected the API key. Check its value and permissions.");
  }
  if (response.status === 429) {
    throw new Error("Brevo request limit reached. Wait before trying again.");
  }
  if (!response.ok) throw new Error("Brevo could not complete the connection check.");
  try {
    return await response.json();
  } catch {
    throw new Error("Brevo returned an unexpected response.");
  }
}

// Verify credentials and sender readiness without submitting any email.
async function checkBrevoConnection() {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Set BREVO_API_KEY, BREVO_SENDER_EMAIL and BREVO_SENDER_NAME in backend/.env.");
  }
  const { BREVO_API_KEY, BREVO_SENDER_EMAIL } = parsed.data;
  const [account, senderList] = await Promise.all([
    brevoGet("/account", BREVO_API_KEY),
    brevoGet("/senders", BREVO_API_KEY),
  ]);
  if (account?.relay?.enabled !== true) {
    throw new Error("Enable transactional email on your Brevo account before sending.");
  }
  if (!Array.isArray(senderList?.senders)) {
    throw new Error("Brevo returned an unexpected sender list.");
  }
  const sender = senderList.senders.find((entry) =>
    typeof entry.email === "string" &&
    entry.email.toLowerCase() === BREVO_SENDER_EMAIL.toLowerCase());
  if (!sender || sender.active !== true) {
    throw new Error("Add and verify BREVO_SENDER_EMAIL as an active sender in Brevo.");
  }
  return { connected: true, senderVerified: true };
}

module.exports = { checkBrevoConnection };

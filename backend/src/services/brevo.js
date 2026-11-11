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

class BrevoSendError extends Error {
  constructor(message, status) {
    super(message);
    this.deliveryStatus = status;
  }
}

async function sendTransactionalEmail({ email, name, subject, body }) {
  const parsed = configSchema.safeParse(process.env);
  if (!parsed.success) throw new BrevoSendError("Email sender settings are incomplete.", "Failed");
  const config = parsed.data;
  const escaped = body.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]).replace(/\r?\n/g, "<br>");
  let response;
  try {
    response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": config.BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: config.BREVO_SENDER_EMAIL, name: config.BREVO_SENDER_NAME },
        to: [{ email, name }],
        subject,
        htmlContent: "<html><body>" + escaped + "</body></html>",
      }),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
  } catch {
    throw new BrevoSendError("Email outcome is uncertain. Check Brevo logs before sending again.", "Unknown");
  }
  if (!response.ok) {
    if (response.status >= 400 && response.status < 500 && response.status !== 408) {
      throw new BrevoSendError("Brevo rejected this send. Check sender settings, recipient and account limits.", "Failed");
    }
    throw new BrevoSendError("Email outcome is uncertain. Check Brevo logs before sending again.", "Unknown");
  }
  let data;
  try { data = await response.json(); } catch {
    throw new BrevoSendError("Email outcome is uncertain. Check Brevo logs before sending again.", "Unknown");
  }
  if (typeof data.messageId !== "string" || !data.messageId) {
    throw new BrevoSendError("Email outcome is uncertain. Check Brevo logs before sending again.", "Unknown");
  }
  return data.messageId;
}

module.exports = { checkBrevoConnection, sendTransactionalEmail, BrevoSendError };

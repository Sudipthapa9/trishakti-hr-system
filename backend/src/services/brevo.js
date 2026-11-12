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

// Read provider events only: checking delivery never resends an email.
async function getDeliveryEvent(messageId, email) {
  const key = process.env.BREVO_API_KEY?.trim();
  if (!key) throw new Error("Configure the Brevo API key before checking delivery.");
  const query = new URLSearchParams({ messageId, email, days: "90", limit: "5000", sort: "desc" });
  const data = await brevoGet("/smtp/statistics/events?" + query, key);
  if (data.events !== undefined && !Array.isArray(data.events)) throw new Error("Brevo returned an unexpected event list.");
  const names = new Map([
    ["delivered","Delivered"], ["hardBounces","Hard bounce"], ["hard_bounce","Hard bounce"],
    ["softBounces","Soft bounce"], ["soft_bounce","Soft bounce"], ["blocked","Blocked"],
    ["invalid","Invalid recipient"], ["error","Error"], ["deferred","Deferred"],
  ]);
  const events = (data.events || []).filter(event => event.messageId === messageId &&
    event.email?.toLowerCase() === email.toLowerCase() && names.has(event.event) && Number.isFinite(Date.parse(event.date)))
    .sort((a,b) => Date.parse(b.date)-Date.parse(a.date));
  return events.length ? { event: names.get(events[0].event), date: events[0].date } : null;
}
module.exports = { checkBrevoConnection, sendTransactionalEmail, BrevoSendError, getDeliveryEvent };

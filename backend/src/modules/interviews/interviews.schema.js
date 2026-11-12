const { z } = require("zod");
const fields = {
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
  interviewer: z.string().trim().min(1).max(200),
  meetingUrl: z
    .union([
      z.literal(""),
      z
        .url()
        .max(2000)
        .refine(
          (value) => new URL(value).protocol === "https:",
          "Use an HTTPS meeting link.",
        ),
    ])
    .default(""),
  location: z.string().trim().max(500).default(""),
  notes: z.string().trim().max(5000).default(""),
};
function scheduleValid(value) {
  return (
    new Date(value.endsAt) > new Date(value.startsAt) &&
    new Date(value.endsAt) - new Date(value.startsAt) <= 8 * 3600000 &&
    Boolean(value.meetingUrl || value.location)
  );
}
const createSchema = z
  .object({
    id: z.string().uuid(),
    applicationId: z.string().uuid(),
    ...fields,
  })
  .strict()
  .refine(
    scheduleValid,
    "Choose an end after the start (up to 8 hours) and a meeting link or location.",
  );
const updateSchema = z
  .object({ ...fields, expectedVersion: z.number().int().positive() })
  .strict()
  .refine(scheduleValid);
const statusSchema = z
  .object({
    status: z.enum(["Completed", "Cancelled"]),
    expectedVersion: z.number().int().positive(),
  })
  .strict();
module.exports = { createSchema, updateSchema, statusSchema };

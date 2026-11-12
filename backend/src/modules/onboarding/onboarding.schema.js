const { z } = require("zod");
const startSchema = z.object({ offerId: z.string().uuid() }).strict();
const checklistSchema = z.object({
  expectedVersion: z.number().int().positive(),
  checklist: z.object({
    documents: z.boolean(), payroll: z.boolean(),
    accounts: z.boolean(), orientation: z.boolean(),
  }).strict(),
}).strict();
module.exports = { startSchema, checklistSchema };

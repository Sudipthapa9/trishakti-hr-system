const { z } = require("zod");

const applicationSchema = z.object({
  requestId: z.string().uuid(),
  jobId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(5).max(50).regex(/^[+\d\s().-]+$/),
  coverLetter: z.string().trim().max(10000).optional().default(""),
}).strict();

module.exports = { applicationSchema };

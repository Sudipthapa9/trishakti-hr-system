const { z } = require("zod");

const updateCandidateSchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(5).max(50).regex(/^[+\d\s().-]+$/),
  // Compare the values originally loaded to avoid silently overwriting another edit.
  expectedFullName: z.string().min(1).max(200),
  expectedPhone: z.string().min(1).max(50),
}).strict();

module.exports = { updateCandidateSchema };

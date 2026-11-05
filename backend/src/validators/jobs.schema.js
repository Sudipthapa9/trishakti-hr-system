const { z } = require("zod");

// Reject missing, blank, or excessively long values.
const createJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(200),
  employmentType: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(10000),
}).strict();

module.exports = { createJobSchema };
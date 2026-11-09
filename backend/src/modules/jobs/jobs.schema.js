const { z } = require("zod");

const skillsSchema = z.array(z.object({
  name: z.string().trim().min(1).max(100),
  weight: z.number().int().min(1).max(5),
}).strict()).max(50).refine(
  (skills) => new Set(skills.map((skill) => skill.name.toLowerCase())).size === skills.length,
  { message: "Skill names must be unique." },
);

// Reject missing, blank, or excessively long values.
const createJobSchema = z.object({
  title: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(100),
  location: z.string().trim().min(1).max(200),
  employmentType: z.string().trim().min(1).max(100),
  description: z.string().trim().min(1).max(10000),
  closingDate: z.union([z.string().date(), z.literal("")]).optional(),
  responsibilities: z.string().trim().max(10000).optional(),
  requiredSkills: skillsSchema.optional(),
  preferredSkills: skillsSchema.optional(),
  vacancies: z.number().int().min(1).max(10000).optional(),
  shortlistMultiplier: z.number().int().min(1).max(100).optional(),
}).strict();

const updateJobSchema = createJobSchema.partial().extend({
  status: z.enum(["Draft", "Open", "Archived"]).optional(),
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: "Provide at least one field to update.",
});

module.exports = { createJobSchema, updateJobSchema };

const { z } = require("zod");
const employeeSchema = z
  .object({
    expectedVersion: z.number().int().positive(),
    fullName: z.string().trim().min(1).max(200),
    email: z.string().trim().toLowerCase().email().max(254),
    phone: z.string().trim().min(1).max(50),
    position: z.string().trim().min(1).max(200),
    department: z.string().trim().min(1).max(100),
    location: z.string().trim().min(1).max(200),
    emergencyName: z.string().trim().max(200),
    emergencyRelationship: z.string().trim().max(100),
    emergencyPhone: z.string().trim().max(50),
  })
  .strict()
  .refine(
    (value) =>
      [
        value.emergencyName,
        value.emergencyRelationship,
        value.emergencyPhone,
      ].every(Boolean) ||
      ![
        value.emergencyName,
        value.emergencyRelationship,
        value.emergencyPhone,
      ].some(Boolean),
    "Complete all emergency contact fields or leave them all empty.",
  );
module.exports = { employeeSchema };

const { z } = require("zod");

// Keep money as decimal strings instead of rounding through JavaScript arithmetic.
const money = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/);
const fields = {
  position: z.string().trim().min(1).max(200),
  currency: z.enum(["NPR", "USD", "INR", "EUR", "GBP"]),
  annualSalary: money.refine((value) => Number(value) > 0),
  signOnBonus: money,
  joiningDate: z.string().date(),
  expiryDate: z.string().date(),
  benefits: z.string().trim().max(10000),
};
const validDates = (body) => body.expiryDate <= body.joiningDate;
const dateError = { message: "Offer expiry must be on or before joining date.", path: ["expiryDate"] };
const createOfferSchema = z.object({
  id: z.string().uuid(), applicationId: z.string().uuid(), ...fields,
}).strict().refine(validDates, dateError);
const updateOfferSchema = z.object({
  ...fields, expectedVersion: z.number().int().min(1),
}).strict().refine(validDates, dateError);

const offerResponseSchema = z.object({
  outcome: z.enum(["Accepted", "Declined", "Withdrawn"]),
  responseDate: z.string().date(),
  notes: z.string().trim().max(5000).optional().default(""),
  expectedVersion: z.number().int().min(1),
}).strict();

module.exports = { createOfferSchema, updateOfferSchema, offerResponseSchema };

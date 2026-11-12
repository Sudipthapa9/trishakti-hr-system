const router = require("express").Router();
const { z } = require("zod");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const handlers = require("./onboarding.controller");
const { startSchema, checklistSchema } = require("./onboarding.schema");
router.use(checkJwt, requireRole("hr", "hr-head"), (req, res, next) => {
  res.set("Cache-Control", "no-store"); next();
});
router.param("id", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ error: "Invalid onboarding identifier." });
  next();
});
router.get("/", handlers.list);
router.post("/", validate(startSchema), handlers.start);
router.get("/:id", handlers.get);
router.patch("/:id", validate(checklistSchema), handlers.update);
router.post("/:id/complete", validate(z.object({ expectedVersion: z.number().int().positive() }).strict()), handlers.complete);
module.exports = router;

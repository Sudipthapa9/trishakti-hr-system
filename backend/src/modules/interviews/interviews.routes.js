const router = require("express").Router();
const { z } = require("zod");
const validate = require("../../middleware/validate");
const handlers = require("./interviews.controller");
const schemas = require("./interviews.schema");
router.use(
  require("../../middleware/auth"),
  require("../../middleware/rbac")("hr", "hr-head"),
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
);
router.param("id", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success)
    return res.status(400).json({ error: "Invalid interview identifier." });
  next();
});
router.get("/", handlers.list);
router.get("/:id", handlers.get);
router.post("/", validate(schemas.createSchema), handlers.create);
router.patch("/:id", validate(schemas.updateSchema), handlers.update);
router.post("/:id/status", validate(schemas.statusSchema), handlers.status);
router.post(
  "/:id/notification",
  validate(z.object({ expectedVersion: z.number().int().positive() }).strict()),
  handlers.notification,
);
module.exports = router;

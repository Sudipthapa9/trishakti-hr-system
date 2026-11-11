const express = require("express");
const { z } = require("zod");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const handlers = require("./communications.controller");
const router = express.Router();
router.use(checkJwt, requireRole("hr", "hr-head"), (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.param("id", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ error: "Invalid message identifier." });
  next();
});
router.get("/", handlers.listMessages);
router.get("/:id", handlers.getMessage);
router.post("/", validate(handlers.createDraftSchema), handlers.createDraft);
router.patch("/:id", validate(handlers.editDraftSchema), handlers.editDraft);
router.post("/:id/send", validate(handlers.sendSchema), handlers.sendMessage);
module.exports = router;

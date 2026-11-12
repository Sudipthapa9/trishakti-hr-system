const router = require("express").Router();
const { z } = require("zod");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const handlers = require("./employees.controller");
router.use(checkJwt, requireRole("hr", "hr-head"), (req, res, next) => {
  res.set("Cache-Control", "no-store"); next();
});
router.param("id", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ error: "Invalid employee identifier." });
  next();
});
router.get("/", handlers.list);
router.get("/:id", handlers.get);
module.exports = router;

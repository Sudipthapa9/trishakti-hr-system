const router = require("express").Router({ mergeParams: true });
const { z } = require("zod");
const multer = require("multer");
const handlers = require("./documents.controller");
router.use(
  require("../../middleware/auth"),
  require("../../middleware/rbac")("hr", "hr-head"),
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!z.string().uuid().safeParse(req.params.id).success)
      return res.status(400).json({ error: "Invalid onboarding identifier." });
    next();
  },
);
router.param("documentId", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success)
    return res.status(400).json({ error: "Invalid document identifier." });
  next();
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
    fields: 1,
    parts: 2,
    fieldSize: 100,
  },
}).single("document");
router.get("/", handlers.list);
router.post(
  "/",
  (req, res, next) =>
    upload(req, res, (error) => {
      if (error instanceof multer.MulterError)
        return res
          .status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
          .json({ error: "Upload one PDF or DOCX up to 10MB." });
      if (error) return next(error);
      next();
    }),
  handlers.upload,
);
router.get("/:documentId", handlers.download);
module.exports = router;

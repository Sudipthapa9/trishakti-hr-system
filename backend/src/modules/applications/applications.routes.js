const express = require("express");
const multer = require("multer");
const { rateLimit } = require("express-rate-limit");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const { submitApplication, listApplications, downloadResume } = require("./applications.controller");

const router = express.Router();
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 6, fieldSize: 40000, parts: 7 },
}).single("resume");

// Bound public upload traffic before buffering the multipart request.
router.post("/", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many submissions. Please try again later." },
}), (req, res, next) => {
  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400)
        .json({ error: "Upload one PDF or DOCX up to 10MB and complete the application fields." });
    }
    if (error) return next(error);
    next();
  });
}, submitApplication);

router.get("/", checkJwt, requireRole("hr", "hr-head"), listApplications);
router.get("/:id/resume", checkJwt, requireRole("hr", "hr-head"), downloadResume);

module.exports = router;

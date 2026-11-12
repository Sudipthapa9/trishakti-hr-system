const router = require("express").Router();
router.use(
  require("../../middleware/auth"),
  require("../../middleware/rbac")("hr", "hr-head"),
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
);
router.get("/", require("./dashboard.controller").getDashboard);
module.exports = router;

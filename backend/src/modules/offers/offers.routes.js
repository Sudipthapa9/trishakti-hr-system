const express = require("express");
const { z } = require("zod");
const checkJwt = require("../../middleware/auth");
const requireRole = require("../../middleware/rbac");
const validate = require("../../middleware/validate");
const handlers = require("./offers.controller");
const { createOfferSchema, updateOfferSchema, offerResponseSchema } = require("./offers.schema");
const { sendSchema } = require("../communications/communications.controller");
const router = express.Router();
router.use(checkJwt, requireRole("hr", "hr-head"), (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
router.param("id", (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success) return res.status(400).json({ error: "Invalid offer identifier." });
  next();
});
router.get("/", handlers.listOffers);
router.get("/:id", handlers.getOffer);
router.post("/", validate(createOfferSchema), handlers.createOffer);
router.patch("/:id", validate(updateOfferSchema), handlers.updateOffer);
router.post("/:id/send", validate(sendSchema), handlers.sendOffer);
router.post("/:id/response", validate(offerResponseSchema), handlers.recordOfferResponse);
module.exports = router;

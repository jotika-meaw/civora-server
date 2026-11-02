const express = require("express");
const { NewsletterSubscriber } = require("../models/NewsletterSubscriber");
const { validate } = require("../middleware/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { newsletterSchema } = require("../utils/validation");

const router = express.Router();

// POST /api/newsletter/subscribe — public
router.post(
  "/subscribe",
  validate(newsletterSchema),
  asyncHandler(async (req, res) => {
    try {
      await NewsletterSubscriber.create({
        email: req.body.email.toLowerCase().trim(),
      });
      return res.status(201).json({ message: "Subscribed" });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(200).json({ message: "Already subscribed" });
      }
      throw err;
    }
  })
);

module.exports = router;

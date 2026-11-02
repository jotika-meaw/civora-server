const mongoose = require("mongoose");

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    subscribedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = {
  NewsletterSubscriber:
    mongoose.models.NewsletterSubscriber ||
    mongoose.model("NewsletterSubscriber", newsletterSchema),
};

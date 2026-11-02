const mongoose = require("mongoose");

const CATEGORIES = [
  "Cleanup",
  "Donation",
  "Plantation",
  "Education",
  "Health",
  "Food",
  "Environment",
  "Community",
  "Other",
];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, required: true, enum: CATEGORIES },
    image: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    eventDate: { type: Date, required: true },
    creatorId: { type: String, required: true, index: true },
    creatorEmail: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

eventSchema.index({ eventDate: 1 });
eventSchema.index({ category: 1, eventDate: 1 });
eventSchema.index({ title: "text", description: "text", location: "text" });

module.exports = {
  Event: mongoose.models.Event || mongoose.model("Event", eventSchema),
  CATEGORIES,
};

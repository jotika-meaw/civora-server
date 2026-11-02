const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    userEmail: { type: String, required: true, trim: true },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Prevent duplicate participation at the DB level
participantSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = {
  Participant:
    mongoose.models.Participant ||
    mongoose.model("Participant", participantSchema),
};

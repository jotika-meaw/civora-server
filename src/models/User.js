const mongoose = require("mongoose");

// Maps to the Better Auth `user` collection in the same MongoDB database.
// Better Auth owns writes; Express only reads/updates display fields here.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    image: { type: String, trim: true, default: null },
  },
  { collection: "user", strict: false, timestamps: true }
);

module.exports = {
  User: mongoose.models.user || mongoose.model("user", userSchema),
};

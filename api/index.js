const mongoose = require("mongoose");
const app = require("../src/server");

module.exports = async function handler(req, res) {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
  }
  return app(req, res);
};

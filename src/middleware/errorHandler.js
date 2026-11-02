// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose bad ObjectId
  if (err?.name === "CastError") {
    return res.status(400).json({ message: "Invalid id format" });
  }
  // Mongoose duplicate key (e.g. duplicate join, duplicate newsletter email)
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Duplicate entry", keyValue: err.keyValue });
  }
  const status = err?.status || 500;
  res.status(status).json({
    message: err?.message || "Internal server error",
  });
}

module.exports = { errorHandler };

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./config/db");
const { errorHandler } = require("./middleware/errorHandler");
const eventsRouter = require("./routes/events");
const mineRouter = require("./routes/mine");
const usersRouter = require("./routes/users");
const newsletterRouter = require("./routes/newsletter");
const statsRouter = require("./routes/stats");

const app = express();
const PORT = process.env.PORT || 5000;

const clientUrls = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || clientUrls.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({ name: "civora-server", status: "ok" });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/events", eventsRouter);
// Spec endpoints: /api/my-events and /api/my-joined-events
app.use("/api/my-events", (req, res, next) => {
  req.url = "/";
  mineRouter(req, res, next);
});
app.use("/api/my-joined-events", (req, res, next) => {
  req.url = "/joined";
  mineRouter(req, res, next);
});
// Convenience aliases under /api/mine (used by frontend)
app.use("/api/mine", mineRouter);
app.use("/api/users", usersRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/stats", statsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});
app.use(errorHandler);

async function start() {
  try {
    await connectDB(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
  app.listen(PORT, () => console.log(`civora-server listening on :${PORT}`));
}

if (require.main === module) start();

module.exports = app;

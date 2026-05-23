const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const contributionsRoutes = require("./routes/contributions.routes");

/** @returns {express.Express} */
function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  /** Empty/unset/`*` ⇒ reflect request origin so local dev works. */
  const raw = process.env.CORS_ORIGIN;
  const corsOrigin =
    raw == null || String(raw).trim() === "" || String(raw).trim() === "*"
      ? true
      : String(raw)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
  app.use(
    cors({
      origin: corsOrigin,
      credentials: false,
    })
  );

  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/contributions", contributionsRoutes);

  app.use((_req, res) => res.status(404).json({ message: "Not found" }));

  // Express default error handler signature
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  });

  return app;
}

module.exports = { createApp };

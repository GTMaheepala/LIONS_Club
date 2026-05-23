/**
 * Bootstrap order matters:
 * 1) Load environment variables (before any module reads process.env).
 * 2) Connect database & seed super-admin.
 * 3) Build Express app and listen.
 */

require("dotenv").config();

const mongoose = require("mongoose");
const { createApp } = require("./src/app");
const { ensureSuperAdmin } = require("./src/bootstrap/ensureSuperAdmin");

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET?.trim();

async function main() {
  if (!MONGO_URI) {
    console.error("Missing MONGO_URI in environment (.env or host config).");
    process.exit(1);
  }

  if (!JWT_SECRET) {
    console.error(
      "Missing JWT_SECRET in backend/.env (needed for signing login tokens).\n" +
        "Add a long random string, e.g.: JWT_SECRET=your-secret-here-min-32-chars\n" +
        "See backend/.env.example."
    );
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB Connected");

  await ensureSuperAdmin();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`LCMS API listening on port ${PORT}`);
    console.log("API prefixes: /api/auth  /api/contributions  (contributions handlers in src/controllers/)");
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

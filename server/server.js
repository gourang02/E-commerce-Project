console.log("🔄 [1/5] Starting Raunak Opticals server...");

// Catch uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION:", err.message || err);
  process.exit(1);
});

console.log("🔄 [2/5] Loading dotenv...");
try { require("dotenv").config(); } catch (_) { console.log("   (no .env file, using system env vars)"); }

console.log("🔄 [3/5] Env check:", {
  NODE_ENV: process.env.NODE_ENV || "(not set)",
  PORT: process.env.PORT || "(not set, default 5000)",
  MONGO_URI: process.env.MONGO_URI ? "✅ SET" : "❌ NOT SET",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? "✅ SET" : "❌ NOT SET",
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ? "✅ SET" : "❌ NOT SET",
  CLIENT_URL: process.env.CLIENT_URL || "(not set)",
});

console.log("🔄 [4/5] Loading app modules...");
const connectDB = require("./src/config/db");
const app = require("./src/app");
console.log("   ✅ Modules loaded successfully");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log("🔄 [5/5] Connecting to MongoDB...");
  await connectDB();

  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║    🕶️  Raunak Opticals API Server         ║
║    🚀  Running on port ${PORT}              ║
║    🌍  Environment: ${process.env.NODE_ENV || "development"}        ║
╚══════════════════════════════════════════╝
    `);
  });
};

startServer().catch((err) => {
  console.error("❌ Failed to start server:", err.message);
  console.error(err.stack);
  process.exit(1);
});


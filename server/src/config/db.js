const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌  MONGO_URI is not set! Please configure it in environment variables.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 45000,
    });
    console.log(`✅  MongoDB connected (Atlas): ${conn.connection.host}`);
  } catch (err) {
    console.error("❌  MongoDB Atlas connection failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
    // In development, try local fallback
    console.warn("⚠️  Trying local database fallback...");
    try {
      const connLocal = await mongoose.connect("mongodb://127.0.0.1:27017/raunak_opticals", {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅  MongoDB connected (Local): ${connLocal.connection.host}`);
    } catch (localErr) {
      console.error("❌  Both MongoDB Atlas and local connection failed.");
      console.error("Please configure MONGO_URI in your server/.env file.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;


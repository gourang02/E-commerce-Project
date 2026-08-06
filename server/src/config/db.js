const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log(`✅  MongoDB connected (Atlas): ${conn.connection.host}`);
  } catch (err) {
    console.warn("⚠️  MongoDB Atlas connection failed. Trying local database fallback...");
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

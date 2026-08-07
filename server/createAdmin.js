const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./src/models/User.model");
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/raunak_opticals";

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(MONGO_URI);
    console.log("Connected!");

    // Create / Update client_admin user
    let clientAdmin = await User.findOne({ username: "client_admin" });
    if (clientAdmin) {
      clientAdmin.role = "admin";
      clientAdmin.password = "admin12345";
      await clientAdmin.save();
    } else {
      clientAdmin = new User({
        name: "Client Admin",
        username: "client_admin",
        email: "client_admin@raunakopticals.com",
        phone: "9876543210",
        password: "admin12345",
        role: "admin",
        isActive: true
      });
      await clientAdmin.save();
    }

    console.log("✅ Admin accounts configured successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to create admin:", error);
    process.exit(1);
  }
}

createAdmin();

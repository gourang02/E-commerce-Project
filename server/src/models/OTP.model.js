const mongoose = require("mongoose");

// TTL index auto-deletes expired OTPs
const otpSchema = new mongoose.Schema({
  phone: { type: String, required: true, index: true },
  hashedOtp: { type: String, required: true },
  purpose: {
    type: String,
    enum: ["signup", "login", "forgot-password"],
    required: true,
  },
  attempts: { type: Number, default: 0 }, // track failed verification attempts
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    index: { expires: 0 }, // TTL: delete when expiresAt is reached
  },
});

module.exports = mongoose.model("OTP", otpSchema);

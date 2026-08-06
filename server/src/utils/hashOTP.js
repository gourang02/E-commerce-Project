const crypto = require("crypto");

/**
 * Hash a 6-digit OTP using SHA-256 (not bcrypt — OTPs are short-lived and
 * need fast comparison). Store hashed version in DB, never plain text.
 */
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp.toString()).digest("hex");
};

/**
 * Generate a cryptographically random 6-digit OTP
 */
const generateOTP = () => {
  // Produces a random number 100000–999999
  return Math.floor(100000 + crypto.randomInt(900000)).toString();
};

module.exports = { hashOTP, generateOTP };

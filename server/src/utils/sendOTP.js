const axios = require("axios");

/**
 * Send OTP via MSG91
 * Docs: https://docs.msg91.com/reference/send-otp
 *
 * For development without MSG91 keys, OTP is logged to console.
 */
const sendOTP = async (phone, otp) => {
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev && !process.env.MSG91_AUTH_KEY) {
    // ── Development mode: log OTP to console ──
    console.log(`\n📱  [DEV] OTP for ${phone}: ${otp}\n`);
    return { success: true, mode: "console" };
  }

  try {
    // Ensure phone is in E.164 format: 91XXXXXXXXXX (no + sign for MSG91)
    const formattedPhone = phone.startsWith("91") ? phone : `91${phone}`;

    const response = await axios.post(
      "https://control.msg91.com/api/v5/otp",
      {
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: formattedPhone,
        authkey: process.env.MSG91_AUTH_KEY,
        otp,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    return { success: true, data: response.data };
  } catch (error) {
    console.error("MSG91 OTP send failed:", error.response?.data || error.message);
    throw new Error("Failed to send OTP. Please try again.");
  }
};

module.exports = sendOTP;

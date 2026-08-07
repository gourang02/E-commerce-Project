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
    // Ensure phone is numeric and formatted: 91XXXXXXXXXX (no + sign for MSG91)
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

    const response = await axios.get("https://control.msg91.com/api/v5/otp", {
      params: {
        template_id: process.env.MSG91_TEMPLATE_ID || process.env.MSG91_WIDGET_ID,
        mobile: formattedPhone,
        otp: String(otp),
      },
      headers: {
        authkey: process.env.MSG91_AUTH_KEY,
      },
      timeout: 8000,
    });

    console.log(`📱  [MSG91] OTP sent to ${formattedPhone}:`, response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("📱 [MSG91 WARN] SMS OTP dispatch issue:", error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

module.exports = sendOTP;

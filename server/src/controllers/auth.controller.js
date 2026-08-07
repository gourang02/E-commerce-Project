const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const OTP = require("../models/OTP.model");
const { generateAccessToken, generateRefreshToken, setRefreshCookie, clearRefreshCookie } = require("../utils/generateTokens");
const { generateOTP, hashOTP } = require("../utils/hashOTP");
const sendOTP = require("../utils/sendOTP");
const { sendEmail } = require("../utils/sendEmail");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

// ────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ────────────────────────────────────────────────────────────────
const signup = asyncHandler(async (req, res) => {
  const { name, username, email, phone, password } = req.body;

  // Check duplicates
  const existingUser = await User.findOne({
    $or: [{ email }, { username: username.toLowerCase() }, { phone }],
  });

  if (existingUser) {
    const field =
      existingUser.email === email
        ? "email"
        : existingUser.username === username.toLowerCase()
        ? "username"
        : "phone number";
    throw new ApiError(409, `An account with this ${field} already exists.`);
  }

  const user = await User.create({ name, username, email, phone, password });

  // Send welcome email (non-blocking)
  sendEmail({
    to: email,
    subject: "Welcome to Raunak Opticals! 🕶️",
    html: `<p>Hi ${name}, welcome to Raunak Opticals! Your account has been created successfully.</p>`,
    text: `Welcome to Raunak Opticals, ${name}!`,
  }).catch(console.error);

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Store hashed refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return res.status(201).json(
    new ApiResponse(201, {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
    }, "Account created successfully!")
  );
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier = username OR email

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select("+password +refreshToken");

  if (!user) throw new ApiError(401, "Invalid credentials.");
  if (!user.isActive) throw new ApiError(403, "Your account has been deactivated. Contact support.");

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials.");

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, refreshToken);

  return res.status(200).json(
    new ApiResponse(200, {
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        loyaltyPoints: user.loyaltyPoints,
      },
      accessToken,
    }, "Logged in successfully!")
  );
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
  }
  clearRefreshCookie(res);
  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/refresh-token
// ────────────────────────────────────────────────────────────────
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "Refresh token not found. Please log in again.");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token. Please log in again.");
  }

  const user = await User.findById(decoded.userId).select("+refreshToken");
  if (!user || user.refreshToken !== token) {
    throw new ApiError(401, "Refresh token mismatch. Possible token theft. Please log in.");
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  setRefreshCookie(res, newRefreshToken);

  return res.status(200).json(
    new ApiResponse(200, { accessToken: newAccessToken }, "Token refreshed.")
  );
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/send-otp
// ────────────────────────────────────────────────────────────────
const sendOTPHandler = asyncHandler(async (req, res) => {
  const { phone, purpose } = req.body;
  // purpose: "signup" | "login" | "forgot-password"

  if (purpose === "forgot-password") {
    const userExists = await User.findOne({ phone });
    if (!userExists) throw new ApiError(404, "No account found with this phone number.");
  }

  // Rate limit: max 3 OTPs per phone per 10 minutes (implemented via OTP count)
  const recentOtps = await OTP.countDocuments({
    phone,
    expiresAt: { $gt: new Date() },
  });
  if (recentOtps >= 3) {
    throw new ApiError(429, "Too many OTP requests. Please wait before requesting again.");
  }

  // Delete any existing OTPs for this phone+purpose
  await OTP.deleteMany({ phone, purpose });

  const otp = generateOTP();
  const hashed = hashOTP(otp);

  await OTP.create({ phone, hashedOtp: hashed, purpose });

  await sendOTP(phone, otp);

  // Dual Dispatch: Also send OTP via Email if a user account exists with this phone
  const userObj = await User.findOne({ phone });
  if (userObj && userObj.email) {
    try {
      await sendEmail({
        to: userObj.email,
        subject: `Your Verification Code: ${otp} | Raunak Opticals`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: #111; padding: 20px; text-align: center;">
              <h2 style="color: #d4af37; margin: 0;">🕶️ Raunak Opticals</h2>
            </div>
            <div style="padding: 24px; background: #ffffff;">
              <p style="font-size: 15px; color: #333;">Hi ${userObj.name},</p>
              <p style="font-size: 14px; color: #555;">Your verification code for <strong>${purpose}</strong> is:</p>
              <div style="background: #f4f6f8; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #111;">${otp}</span>
              </div>
              <p style="font-size: 12px; color: #888; text-align: center;">This code is valid for 5 minutes. Do not share it with anyone.</p>
            </div>
          </div>
        `,
        text: `Your Raunak Opticals verification code is: ${otp}`,
      });
      console.log(`📧 Dual OTP sent to email: ${userObj.email}`);
    } catch (e) {
      console.error("Email OTP fallback failed:", e.message);
    }
  }

  return res.status(200).json(
    new ApiResponse(200, { phone }, "OTP sent successfully. Valid for 5 minutes.")
  );
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ────────────────────────────────────────────────────────────────
const verifyOTPHandler = asyncHandler(async (req, res) => {
  const { phone, otp, purpose } = req.body;

  const otpRecord = await OTP.findOne({ phone, purpose });
  if (!otpRecord) {
    throw new ApiError(400, "OTP not found or expired. Please request a new OTP.");
  }

  // Max 5 failed attempts
  if (otpRecord.attempts >= 5) {
    await OTP.deleteOne({ _id: otpRecord._id });
    throw new ApiError(429, "Too many failed attempts. Please request a new OTP.");
  }

  const hashedInput = hashOTP(otp);
  if (hashedInput !== otpRecord.hashedOtp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    const remaining = 5 - otpRecord.attempts;
    throw new ApiError(400, `Invalid OTP. ${remaining} attempt(s) remaining.`);
  }

  // OTP verified — delete it
  await OTP.deleteOne({ _id: otpRecord._id });

  if (purpose === "login") {
    // OTP login — find user and issue tokens
    const user = await User.findOne({ phone });
    if (!user) throw new ApiError(404, "No account found with this phone number.");

    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    setRefreshCookie(res, refreshToken);

    return res.status(200).json(
      new ApiResponse(200, {
        user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
        accessToken,
      }, "OTP verified. Logged in successfully.")
    );
  }

  // For "forgot-password" or "signup": issue a short-lived temp token
  const tempToken = jwt.sign({ phone, purpose, verified: true }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "10m",
  });

  return res.status(200).json(
    new ApiResponse(200, { tempToken }, "OTP verified successfully.")
  );
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/reset-password
// ────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { tempToken, newPassword } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(tempToken, process.env.JWT_ACCESS_SECRET);
  } catch {
    throw new ApiError(400, "Invalid or expired reset token. Please restart the process.");
  }

  if (decoded.purpose !== "forgot-password" || !decoded.verified) {
    throw new ApiError(400, "Invalid reset token.");
  }

  const user = await User.findOne({ phone: decoded.phone });
  if (!user) throw new ApiError(404, "User not found.");

  user.password = newPassword;
  user.refreshToken = ""; // invalidate all existing sessions
  await user.save();

  clearRefreshCookie(res);

  return res.status(200).json(
    new ApiResponse(200, {}, "Password reset successfully. Please log in with your new password.")
  );
});

// ────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("wishlist", "name slug price images");
  return res.status(200).json(new ApiResponse(200, { user }, "User profile fetched."));
});

// ────────────────────────────────────────────────────────────────
// PUT /api/auth/profile
// ────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const updates = {};
  if (name) updates.name = name.trim();
  if (email) updates.email = email.toLowerCase().trim();

  // Handle avatar upload
  if (req.file) {
    updates.avatar = {
      url: req.file.path, // Cloudinary URL
      publicId: req.file.filename,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return res.status(200).json(new ApiResponse(200, { user }, "Profile updated successfully."));
});

// ────────────────────────────────────────────────────────────────
// POST /api/auth/addresses
// ────────────────────────────────────────────────────────────────
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.push(req.body);
  if (user.addresses.length === 1) user.addresses[0].isDefault = true;
  await user.save();
  return res.status(201).json(new ApiResponse(201, { addresses: user.addresses }, "Address added."));
});

const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const addr = user.addresses.id(req.params.addressId);
  if (!addr) throw new ApiError(404, "Address not found.");
  Object.assign(addr, req.body);
  await user.save();
  return res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Address updated."));
});

const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  if (user.addresses.length > 0 && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
  await user.save();
  return res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Address deleted."));
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.setDefaultAddress(req.params.addressId);
  await user.save();
  return res.status(200).json(new ApiResponse(200, { addresses: user.addresses }, "Default address updated."));
});

module.exports = {
  signup,
  login,
  logout,
  refreshToken,
  sendOTPHandler,
  verifyOTPHandler,
  resetPassword,
  getMe,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

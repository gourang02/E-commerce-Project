const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  signup, login, logout, refreshToken,
  sendOTPHandler, verifyOTPHandler, resetPassword,
  getMe, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { uploadAvatar } = require("../middlewares/upload.middleware");

// ── Validation rules ────────────────────────────────────────────
const signupRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("username")
    .trim()
    .isLength({ min: 3 }).withMessage("Username must be at least 3 characters.")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores."),
  body("email").isEmail().withMessage("Invalid email address.").normalizeEmail(),
  body("phone")
    .matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number."),
  body("password")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/\d/).withMessage("Password must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password must contain at least one special character."),
];

const loginRules = [
  body("identifier").trim().notEmpty().withMessage("Email or username is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const otpRules = [
  body("phone").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number."),
  body("purpose").isIn(["signup", "login", "forgot-password"]).withMessage("Invalid OTP purpose."),
];

const verifyOtpRules = [
  body("phone").matches(/^[6-9]\d{9}$/).withMessage("Enter a valid 10-digit Indian mobile number."),
  body("otp").isLength({ min: 4, max: 6 }).withMessage("OTP must be 4 to 6 digits.").isNumeric(),
  body("purpose").isIn(["signup", "login", "forgot-password"]).withMessage("Invalid purpose."),
];

const resetPasswordRules = [
  body("tempToken").notEmpty().withMessage("Reset token is required."),
  body("newPassword")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters.")
    .matches(/\d/).withMessage("Must contain at least one number.")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Must contain at least one special character."),
];

// ── Routes ──────────────────────────────────────────────────────
router.post("/signup", signupRules, validate, signup);
router.post("/login", loginRules, validate, login);
router.post("/logout", authenticate, logout);
router.post("/refresh-token", refreshToken);

router.post("/send-otp", otpRules, validate, sendOTPHandler);
router.post("/verify-otp", verifyOtpRules, validate, verifyOTPHandler);
router.post("/reset-password", resetPasswordRules, validate, resetPassword);

router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, uploadAvatar, updateProfile);

router.post("/addresses", authenticate, addAddress);
router.put("/addresses/:addressId", authenticate, updateAddress);
router.delete("/addresses/:addressId", authenticate, deleteAddress);
router.patch("/addresses/:addressId/default", authenticate, setDefaultAddress);

module.exports = router;

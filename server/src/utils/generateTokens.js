const jwt = require("jsonwebtoken");

/**
 * Generate a short-lived access token (15 minutes)
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
  });
};

/**
 * Generate a long-lived refresh token (7 days)
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
  });
};

/**
 * Set refresh token as httpOnly cookie
 */
const setRefreshCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });
};

/**
 * Clear the refresh token cookie on logout
 */
const clearRefreshCookie = (res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
};

module.exports = { generateAccessToken, generateRefreshToken, setRefreshCookie, clearRefreshCookie };

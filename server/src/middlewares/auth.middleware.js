const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Verify access token from Authorization header.
 * Attaches req.user on success.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Access token required. Please log in.");
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new ApiError(401, "Access token expired. Please refresh.");
    }
    throw new ApiError(401, "Invalid access token.");
  }

  const user = await User.findById(decoded.userId).select("-password -refreshToken");
  if (!user) throw new ApiError(401, "User not found. Token may be stale.");
  if (!user.isActive) throw new ApiError(403, "Your account has been deactivated.");

  req.user = user;
  next();
});

/**
 * Optional auth — attaches req.user if token is present, but doesn't block.
 * Used for cart operations that work for both guests and logged-in users.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return next();

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId).select("-password -refreshToken");
    if (user && user.isActive) req.user = user;
  } catch {
    // Token invalid — proceed as guest
  }
  next();
});

module.exports = { authenticate, optionalAuth };

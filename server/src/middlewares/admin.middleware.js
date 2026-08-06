const ApiError = require("../utils/ApiError");

/**
 * Role-based access control middleware.
 * Use after authenticate().
 * Usage: router.get("/admin/...", authenticate, requireRole("admin"), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required."));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to access this resource."));
    }
    next();
  };
};

module.exports = { requireRole };

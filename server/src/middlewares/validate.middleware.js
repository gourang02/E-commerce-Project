const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/**
 * Run after express-validator chains.
 * Returns 422 with structured error array if any validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return next(new ApiError(422, "Validation failed", errorMessages));
  }
  next();
};

module.exports = validate;

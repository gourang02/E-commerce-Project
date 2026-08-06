/**
 * Wraps async route handlers to avoid try/catch boilerplate.
 * Usage: router.get("/path", asyncHandler(myControllerFn))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

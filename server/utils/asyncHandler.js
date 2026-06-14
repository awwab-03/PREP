/**
 * Wraps an async route handler so thrown errors are forwarded to Express's
 * error middleware without repetitive try/catch in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

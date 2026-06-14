/** 404 handler for unknown routes. */
export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

/**
 * Centralized error handler. Normalizes common errors (Mongoose validation,
 * duplicate key, multer) into clean JSON responses.
 */
export function errorHandler(err, req, res, next) {
  let status = err.statusCode || 500;
  let message = err.message || "Server error";

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    status = 400;
    message = "Invalid resource id";
  }

  // Mongoose validation
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || { field: "" })[0];
    message = `${field} already in use`;
  }

  // Multer file-size limit
  if (err.code === "LIMIT_FILE_SIZE") {
    status = 400;
    message = "File too large (max 5 MB)";
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("✗", err);
  }

  res.status(status).json({ message });
}

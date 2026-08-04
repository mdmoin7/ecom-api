import logger from "./logger.js";

/**
 * Custom Error class for operational errors.
 * Use this to throw errors that are anticipated and have safe messages.
 */
class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Indicates this is a trusted operational error
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error handling middleware.
 * Strips out system details and logs errors safely.
 */
const errorHandler = (err, req, res, next) => {
  // Keep complete diagnostics on the server; the response below remains safe.
  logger.error("Unhandled request error", {
    error: err.stack || err.message,
    errorName: err.name,
    method: req.method,
    path: req.originalUrl,
  });

  // 1. Handle Joi Validation Errors (isJoi: true or name: 'ValidationError')
  if (err.isJoi || err.name === "ValidationError") {
    const message = err.details
      ? err.details.map((d) => d.message).join(", ")
      : err.message;

    return res.status(400).json({
      success: false,
      message: `Validation Error: ${message}`,
    });
  }

  // 2. Handle Custom Operational Errors (AppError)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // 3. Handle Generic/Unhandled Database or System Errors
  // We do not expose the raw error message to prevent Information Disclosure
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred on the server.",
  });
};

export { AppError, errorHandler };

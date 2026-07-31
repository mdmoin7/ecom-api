import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors.js";

/**
 * Verifies the JWT from the Authorization header (or httpOnly cookie, if used)
 * and attaches the decoded payload to req.user.
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      throw new AppError(401, "No token provided");
    }

    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError(401, "Token expired"));
    }
    if (err instanceof AppError) {
      return next(err);
    }
    next(new AppError(401, "Invalid token"));
  }
}

/**
 * Restricts access to users whose role is in the allowed list.
 * Must run after authenticate.
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Not authenticated"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }
    next();
  };
}

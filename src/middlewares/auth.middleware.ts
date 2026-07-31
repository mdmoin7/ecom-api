import jwt, { JwtPayload } from "jsonwebtoken";
import { AppError } from "../utils/errors.js";
import { Request, Response, NextFunction } from "express";

/**
 * Verifies the JWT from the Authorization header (or httpOnly cookie, if used)
 * and attaches the decoded payload to req.user.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      throw new AppError(401, "No token provided");
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (typeof decoded === "string") {
      throw new AppError(401, "Invalid token payload");
    }

    req.user = decoded as JwtPayload & { role?: string; userId?: string };
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
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Not authenticated"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }
    next();
  };
}

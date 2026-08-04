import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger.js";

/** Logs each completed HTTP request to Winston without logging request bodies. */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startedAt = process.hrtime.bigint();

  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const log = res.statusCode >= 500 ? logger.error.bind(logger) : logger.info.bind(logger);

    log("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      contentLength: res.getHeader("content-length"),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
  });

  next();
}

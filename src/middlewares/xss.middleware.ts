import { NextFunction, Request, Response } from "express";

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
};
const SENSITIVE_FIELD_NAMES = new Set(["password", "confirmPassword"]);

function escapeHtml(value: string): string {
  return value.replace(/[&<>"'`/]/g, (character) => HTML_ENTITIES[character]);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return escapeHtml(value);

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (!SENSITIVE_FIELD_NAMES.has(key)) {
        (value as Record<string, unknown>)[key] = sanitizeValue(child);
      }
    }
  }

  return value;
}

/**
 * Escapes HTML-significant characters in parsed request bodies before data is
 * validated or persisted. It intentionally does not alter URL query strings
 * or route parameters, which are not stored by this API.
 */
export function xssSanitizer(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.body && typeof req.body === "object") {
    sanitizeValue(req.body);
  }

  next();
}

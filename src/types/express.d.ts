// src/types/express.d.ts
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { role?: string; userId?: string };
    }
  }
}

export {}; // <-- add this line if it's missing

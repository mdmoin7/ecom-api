import dotenv from "dotenv";
import connectToDB from "../src/db/index.js";
import app from "../src/server/index.js";

dotenv.config();

/**
 * Vercel serverless entrypoint.
 * Establishes/reuses the MongoDB connection before passing the request
 * to the Express application.
 */
export default async function handler(req: any, res: any) {
  try {
    await connectToDB();
    return app(req, res);
  } catch (error) {
    console.error("Failed to initialize database connection", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
}

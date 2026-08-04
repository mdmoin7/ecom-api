import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: The API process is running
 */
router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     servers:
 *       - url: /
 *     responses:
 *       200:
 *         description: The API and database are ready to receive traffic
 *       503:
 *         description: The database is not connected
 */
router.get("/ready", (_req, res) => {
  const isDatabaseConnected = mongoose.connection.readyState === 1;

  res.status(isDatabaseConnected ? 200 : 503).json({
    status: isDatabaseConnected ? "ready" : "not_ready",
    database: isDatabaseConnected ? "connected" : "disconnected",
    timestamp: new Date().toISOString(),
  });
});

export default router;

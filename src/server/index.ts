import express from "express";
import helmet from "helmet";
import path from "path";
import productRoutes from "../routes/product.routes.js";
import userRoutes from "../routes/user.routes.js";

import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../utils/errors.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger.js";
import cors from "cors";
import { requestLogger } from "../middlewares/request-logger.middleware.js";
import morgan from "morgan";

// Configure Rate Limiting middleware to prevent abuse and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window: 15 minutes
  limit: 100, // Limit each IP address to 100 requests per window
  standardHeaders: "draft-8", // Standardized headers for rate limit metadata
  legacyHeaders: false, // Disable the legacy X-RateLimit-* headers
  ipv6Subnet: 56, // Subnet masking for IPv6 ranges (less/more aggressive limit pooling)
});

const app = express();
const BASE_URL = "/api/v1";

// Retrieve directory path of the current module file
const currentDir = import.meta.dirname;
app.use(cors());
// Apply security headers using Helmet
app.use(helmet());
// Log completed requests through Winston to the console and log files.
app.use(morgan("dev"));
app.use(requestLogger);

// Apply the configured rate limiter middleware
app.use(limiter);

// Parse incoming requests with JSON payloads
app.use(express.json());

// Parse incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));

// Serve the 'uploads' directory statically at '/images' endpoint
app.use(
  "/images",
  express.static(path.join(currentDir, "..", "..", "uploads")),
);

// Register product routes under the prefix '/api/v1/product'
app.use(BASE_URL + "/products", productRoutes);
app.use(BASE_URL + "/user", userRoutes);

// Register centralized error handling middleware (must be registered last)
app.use(errorHandler);
// API documentation using swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;

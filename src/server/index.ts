import express from "express";
import helmet from "helmet";
import path from "path";
import productRoutes from "../routes/product.routes.js";
import userRoutes from "../routes/user.routes.js";
import healthRoutes from "../routes/health.routes.js";

import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../utils/errors.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../docs/swagger.js";
import cors from "cors";
import { requestLogger } from "../middlewares/request-logger.middleware.js";
import { xssSanitizer } from "../middlewares/xss.middleware.js";

// Configure Rate Limiting middleware to prevent abuse and brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  ipv6Subnet: 56,
});

const app = express();
const BASE_URL = "/api/v1";

// Retrieve directory path of the current module file
const currentDir = import.meta.dirname;

app.use(cors());
app.use(helmet());
app.use(requestLogger);
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(xssSanitizer);

// Serve the 'uploads' directory statically at '/images' endpoint
app.use(
  "/images",
  express.static(path.join(currentDir, "..", "..", "uploads")),
);

// Liveness and readiness probes for load balancers and orchestrators.
app.use(healthRoutes);

// Register product and user routes.
app.use(BASE_URL + "/products", productRoutes);
app.use(BASE_URL + "/user", userRoutes);

// Swagger UI needs inline bootstrap code/styles. Helmet's default CSP can
// prevent Swagger UI from rendering even though the API itself is healthy.
// Remove only the CSP header for the documentation route; all other routes
// retain Helmet's normal security headers.
app.use("/api-docs", (req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Ecom API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);

// Make the OpenAPI document available for clients and debugging.
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

app.use(errorHandler);

export default app;

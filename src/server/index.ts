import express from "express";
import helmet from "helmet";
import path from "path";
import productRoutes from "../routes/product.routes.js";
import userRoutes from "../routes/user.routes.js";
import healthRoutes from "../routes/health.routes.js";

import { rateLimit } from "express-rate-limit";
import { errorHandler } from "../utils/errors.js";
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

// OpenAPI document for Swagger UI and external API tooling.
app.get("/api-docs.json", (_req, res) => res.json(swaggerSpec));

// Swagger UI is rendered from CDN assets rather than swagger-ui-express's
// package-local static files. This avoids serverless bundling/path issues on
// Vercel while keeping the OpenAPI specification served by this API.
app.get("/api-docs", (_req, res) => {
  res.removeHeader("Content-Security-Policy");
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ecom API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.0.1/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: "/api-docs.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`);
});

app.use(errorHandler);

export default app;

// AUTO-GENERATED FILE - DO NOT EDIT.
// This checked-in copy keeps local development working. The build regenerates it
// from src/routes/*.ts using src/docs/generate-swagger.ts.

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Product API",
    version: "1.0.0",
    description: "Product management endpoints",
  },
  servers: [{ url: "/api/v1", description: "Current API server" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Product: {
        type: "object",
        properties: {
          productId: { type: "string", example: "b3f1c2a4-..." },
          productName: { type: "string" },
          productDescription: { type: "string" },
          productImage: { type: "string" },
          productPrice: { type: "number" },
          productSalePrice: { type: "number" },
          productRating: { type: "number" },
          productStock: { type: "integer" },
          productCategory: { type: "string" },
          productStatus: { type: "string", default: "active" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      ProductInput: {
        type: "object",
        required: ["productName"],
        properties: {
          productName: { type: "string" },
          productDescription: { type: "string" },
          productPrice: { type: "number" },
          productSalePrice: { type: "number" },
          productCategory: { type: "string" },
          productStock: { type: "integer" },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {},
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/products": {
      get: {
        summary: "List products, with optional filtering and sorting",
        tags: ["Products"],
        parameters: [
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "status", schema: { type: "string", enum: ["active", "inactive", "discontinued"] } },
          { in: "query", name: "inStock", schema: { type: "boolean" } },
          { in: "query", name: "minPrice", schema: { type: "number" } },
          { in: "query", name: "maxPrice", schema: { type: "number" } },
          { in: "query", name: "tags", schema: { type: "string" } },
          { in: "query", name: "search", schema: { type: "string" } },
          { in: "query", name: "page", schema: { type: "integer", default: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", default: 20, maximum: 100 } },
          { in: "query", name: "sort", schema: { type: "string", default: "-createdAt" } },
        ],
        responses: { 200: { description: "Products fetched" } },
      },
      post: {
        summary: "Create a new product",
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } },
        },
        responses: { 201: { description: "Product created" }, 400: { description: "Validation error" }, 401: { description: "Not authenticated" }, 403: { description: "Insufficient permissions" } },
      },
    },
    "/products/upload": {
      post: {
        summary: "Upload an image and link it to a product",
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image", "id"],
                properties: {
                  image: { type: "string", format: "binary" },
                  id: { type: "string", description: "productId to attach the image to" },
                },
              },
            },
          },
        },
        responses: { 200: { description: "Image uploaded and linked" }, 400: { description: "Missing file or product ID" }, 401: { description: "Not authenticated" }, 403: { description: "Insufficient permissions" }, 404: { description: "Product not found" } },
      },
    },
    "/products/seed": {
      post: {
        summary: "Seed database with mock product data (wipes existing collection first)",
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "query", name: "count", schema: { type: "integer", default: 500, maximum: 5000 } }],
        responses: { 200: { description: "Seeding successful" }, 401: { description: "Not authenticated" }, 403: { description: "Insufficient permissions" } },
      },
    },
    "/products/{id}": {
      get: {
        summary: "Get a product by its productId",
        tags: ["Products"],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product found", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } }, 404: { description: "Product not found" } },
      },
      patch: {
        summary: "Partially update a product by its productId",
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ProductInput" } } } },
        responses: { 200: { description: "Product updated" }, 400: { description: "Validation error" }, 401: { description: "Not authenticated" }, 403: { description: "Insufficient permissions" }, 404: { description: "Product not found" } },
      },
      delete: {
        summary: "Delete a product by its productId",
        tags: ["Products"],
        security: [{ bearerAuth: [] }],
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Product deleted" }, 401: { description: "Not authenticated" }, 403: { description: "Insufficient permissions" }, 404: { description: "Product not found" } },
      },
    },
    "/user/register": {
      post: { summary: "User registration", tags: ["User"], responses: { 200: { description: "Registration successful" } } },
    },
    "/user/login": {
      post: { summary: "User login", tags: ["User"], responses: { 200: { description: "Login successful" } } },
    },
    "/health": {
      get: { summary: "Liveness probe", tags: ["Health"], servers: [{ url: "/" }], responses: { 200: { description: "The API process is running" } } },
    },
    "/ready": {
      get: { summary: "Readiness probe", tags: ["Health"], servers: [{ url: "/" }], responses: { 200: { description: "The API and database are ready to receive traffic" }, 503: { description: "The database is not connected" } } },
    },
  },
} as const;

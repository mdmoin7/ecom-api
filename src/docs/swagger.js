import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Product API",
      version: "1.0.0",
      description: "Product management endpoints",
    },
    components: {
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
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);

import express from "express";
import ProductController from "../controller/product.controller.js";
import ProductService from "../services/product.service.js";
import ProductRepository from "../repos/product.repository.js";
import upload from "../config/file-upload.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const Router = express.Router();

// Initialize repository, service, and controller for dependency injection
const repository = new ProductRepository();
const service = new ProductService(repository);
const controller = new ProductController(service);

// --- Write Operations (admin only) ---

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Product created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
Router.post("/", authenticate, authorize("admin"), (req, res, next) =>
  controller.createProduct(req, res, next),
);

/**
 * @swagger
 * /products/upload:
 *   post:
 *     summary: Upload an image and link it to a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image, id]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               id:
 *                 type: string
 *                 description: productId to attach the image to
 *     responses:
 *       200:
 *         description: Image uploaded and linked
 *       400:
 *         description: Missing file or product ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Product not found
 */
Router.post(
  "/upload",
  authenticate,
  authorize("admin"),
  upload.single("image"),
  (req, res, next) => controller.uploadProductImage(req, res, next),
);

/**
 * @swagger
 * /products/seed:
 *   post:
 *     summary: Seed database with mock product data (wipes existing collection first)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: count
 *         schema: { type: integer, default: 500, maximum: 5000 }
 *         description: Number of products to generate (server-clamped to 5000)
 *     responses:
 *       200:
 *         description: Seeding successful
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 */
Router.post("/seed", (req, res, next) =>
  controller.seedProducts(req, res, next),
);

// --- Read Operations (public) ---

/**
 * @swagger
 * /products:
 *   get:
 *     summary: List products, with optional filtering and sorting
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Exact match on productCategory
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, discontinued] }
 *         description: Exact match on productStatus
 *       - in: query
 *         name: inStock
 *         schema: { type: boolean }
 *         description: true = productStock > 0, false = productStock == 0
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *         description: Minimum productPrice
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *         description: Maximum productPrice
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tags, matches any (e.g. "sale,new")
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search on productName and productDescription
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-indexed)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *         description: Results per page (server-clamped to 100)
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: "-createdAt" }
 *         description: >
 *           Comma-separated sortable fields, "-" prefix for descending.
 *           Allowed fields: productName, productPrice, productSalePrice,
 *           productRating, productStock, createdAt.
 *           Example: -productRating,productPrice
 *     responses:
 *       200:
 *         description: Products fetched (empty array if none match)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 */
Router.get("/", (req, res, next) => controller.getAllProducts(req, res, next));

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by its productId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Product not found
 */
Router.get("/:id", (req, res, next) =>
  controller.getProductById(req, res, next),
);

// --- Update & Delete Operations (admin only) ---

/**
 * @swagger
 * /products/{id}:
 *   patch:
 *     summary: Partially update a product by its productId
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Product not found
 */
Router.patch("/:id", authenticate, authorize("admin"), (req, res, next) =>
  controller.updateProduct(req, res, next),
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product by its productId
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Product not found
 */
Router.delete("/:id", authenticate, authorize("admin"), (req, res, next) =>
  controller.deleteProduct(req, res, next),
);

export default Router;

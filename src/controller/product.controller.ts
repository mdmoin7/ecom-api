// controller/product.controller.js
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import ProductService from "../services/product.service.js";

/**
 * Controller layer responsible for handling incoming HTTP requests,
 * invoking services, formatting responses, and mapping error codes.
 */
class ProductController {
  productService = null;

  /**
   * Injects ProductService dependency.
   * @param {Object} service - Instance of ProductService.
   */
  constructor(service: ProductService) {
    this.productService = service;
  }

  /**
   * Handles request to create a new product.
   * Responds with 201 Created on success, or delegates failure to the error handler.
   */
  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await this.productService.createProduct(req.body);
      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles request to retrieve all products.
   * Responds with 200 OK. An empty collection is still a valid, successful
   * result — it returns 200 with an empty array, not 204.
   */
  async getAllProducts(req, res, next) {
    try {
      const { data, pagination } = await this.productService.findAllProducts(
        req.query,
      );
      return res.status(200).json({
        success: true,
        message:
          data.length > 0
            ? "Products fetched successfully"
            : "No products found",
        data,
        pagination,
      });
    } catch (err) {
      next(err);
    }
  }
  /**
   * Handles request to retrieve a single product by its custom string ID.
   * Responds with 200 OK on success, or 404 Not Found if the product doesn't exist.
   */
  async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const data = await this.productService.findProduct(id);
      if (!data) {
        throw new AppError(404, "Product not found");
      }
      return res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles request to delete a product by its custom ID.
   * Responds with 200 OK on successful deletion, or 404 Not Found if it doesn't exist.
   */
  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const data = await this.productService.deleteProduct(id);
      if (!data) {
        throw new AppError(404, "Product not found");
      }
      return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles request to update product properties by custom ID.
   * Responds with 200 OK on success, or 404 Not Found if the product doesn't exist.
   */
  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const data = await this.productService.updateProduct(id, req.body);
      if (!data) {
        throw new AppError(404, "Product not found");
      }
      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Handles file upload callback to link an image with a product.
   * Responds with 200 OK on success, 400 for missing input, or 404 if the
   * product record could not be found.
   */
  async uploadProductImage(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const id = req.body.id;

      if (!file) {
        throw new AppError(400, "Please upload an image file.");
      }
      if (!id) {
        throw new AppError(400, "Product ID is required.");
      }

      const data = await this.productService.uploadProductImage(id, file);
      if (!data) {
        throw new AppError(404, "Product not found");
      }
      return res.status(200).json({
        success: true,
        message: "Product image uploaded successfully",
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Seeds the database with random mock product data.
   * Optional 'count' query param defaults to 500, clamped server-side.
   * Delegates errors to the central error handler rather than leaking
   * raw error objects to the client.
   */
  async seedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await this.productService.seedProducts(req.query.count);
      return res.status(200).json({
        success: true,
        message,
      });
    } catch (err) {
      next(err);
    }
  }
}

export default ProductController;

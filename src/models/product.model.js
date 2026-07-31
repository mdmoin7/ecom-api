import { Schema, model } from "mongoose";

// Define the MongoDB Schema for the Product entity
const productSchema = Schema(
  {
    // Custom string identifier for products, e.g. UUID or random code
    productId: { type: String, required: true },

    // Display name of the product
    productName: { type: String, required: true },

    // Detailed description of the product features or specs
    productDescription: { type: String },

    // File path or URL to the product image
    productImage: { type: String },

    // Original/Base price of the product
    productPrice: { type: Number, default: 0 },

    // Customer rating from 0.0 to 5.0
    productRating: { type: Number, default: 0 },

    // Number of items available in inventory
    productStock: { type: Number, default: 0 },

    // Discounted or selling price after potential markdowns
    productSalePrice: { type: Number, default: 0 },

    // General classification department of the product
    productCategory: { type: String },

    // Lifecycle or availability status (e.g. active, inactive, discontinued)
    productStatus: { type: String, default: "active" },

    // Tags associated with the product
    tags: { type: [String], default: [] },
  },
  // Automatically manage createdAt and updatedAt timestamp fields
  { timestamps: true },
);
// Text index powers the free-text "search" query param
productSchema.index({ productName: "text", productDescription: "text" });

// Instantiate and compile the Mongoose model
const Product = model("Product", productSchema);

export default Product;

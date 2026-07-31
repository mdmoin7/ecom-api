// models/product.model.ts
import { Schema, model, Document } from "mongoose";

export interface IProduct extends Document {
  productId: string;
  productName: string;
  productDescription?: string;
  productImage?: string;
  productPrice: number;
  productRating: number;
  productStock: number;
  productSalePrice: number;
  productCategory?: string;
  productStatus: "active" | "inactive" | "discontinued";
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    productName: { type: String, required: true },
    productDescription: { type: String },
    productImage: { type: String },
    productPrice: { type: Number, default: 0, min: 0 },
    productRating: { type: Number, default: 0, min: 0, max: 5 },
    productStock: { type: Number, default: 0, min: 0 },
    productSalePrice: { type: Number, default: 0, min: 0 },
    productCategory: { type: String },
    productStatus: { type: String, default: "active" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true },
);

const Product = model<IProduct>("Product", productSchema);
export default Product;

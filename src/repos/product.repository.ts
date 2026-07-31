import Product, { IProduct } from "../models/product.model.js";

/**
 * Data Access Layer (Repository) for executing MongoDB operations on the Product collection.
 */
class ProductRepository {
  /**
   * Persists a new Product document in MongoDB.
   * @param {Object} data - Product details matching schema format.
   * @returns {Promise<Object>} Created product document.
   */
  create(data: Partial<IProduct>): Promise<IProduct> {
    return new Product(data).save();
  }

  /**
   * Finds a product by its unique custom ID.
   * Excludes metadata like Mongo _id, __v, and timestamps from the result.
   * @param {string} id - The custom productId.
   * @returns {Promise<Object|null>} Matching product document or null.
   */
  findById(id: string): Promise<IProduct | null> {
    return Product.findOne({ productId: id }).select({
      _id: 0,
      __v: 0,
      createdAt: 0,
      updatedAt: 0,
    });
  }

  /**
   * Finds products matching an optional filter, in an optional sort order.
   * Excludes metadata like Mongo _id, __v, and timestamps from the results.
   * @param {Object} [filter={}] - MongoDB filter built by the service layer.
   * @param {string} [sort="-createdAt"] - Mongoose sort string, e.g. "-productPrice".
   * @returns {Promise<Array>} List of product documents.
   */
  findAll(filter = {}, sort = "-createdAt"): Promise<IProduct[]> {
    return Product.find(filter)
      .select({
        _id: 0,
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      })
      .sort(sort);
  }

  /**
   * Updates an existing product using its custom ID.
   * runValidators ensures schema-level constraints (min/max, enums, etc.) are
   * enforced on partial updates, not just on create.
   * @param {string} id - The custom productId to locate the document.
   * @param {Object} data - Product update properties.
   * @returns {Promise<Object|null>} Updated product document or null.
   */
  update(id: string, data: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findOneAndUpdate({ productId: id }, data, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Deletes a product from database using its custom ID.
   * @param {string} id - The custom productId.
   * @returns {Promise<Object|null>} Deleted product document or null.
   */
  delete(id: string): Promise<IProduct | null> {
    return Product.findOneAndDelete({ productId: id });
  }

  /**
   * Resets collection contents and imports a bulk set of product documents.
   * @param {Array} data - Array of mock product objects to seed.
   * @returns {Promise<Array>} Inserted product documents list.
   */
  async insertMany(data: Partial<IProduct>[]): Promise<IProduct[]> {
    // Delete all current documents in collection
    await Product.deleteMany({});
    try {
      // Insert new bulk records
      const result = await Product.insertMany(data, { ordered: false });
      return result;
    } catch (err) {
      console.error(
        `insertMany failed: ${err.insertedDocs?.length || 0} succeeded, ` +
          `${err.writeErrors || err.errors ? Object.keys(err.errors || {}).length : 0} failed`,
      );
      console.error(err.writeErrors || err.errors || err.message);
      throw err;
    }
  }
}

export default ProductRepository;

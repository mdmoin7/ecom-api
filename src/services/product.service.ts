import { v4 as uuidv4 } from "uuid";
import {
  ProductObject,
  ProductUpdateObject,
} from "../validations/product.validation.js";
import { generateProducts } from "../utils/generateProducts.js";
import { AppError } from "../utils/errors.js";

const MAX_SEED_COUNT = 5000;
const DEFAULT_SEED_COUNT = 500;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;
// Fields a client is allowed to sort by. Prevents sorting on arbitrary/
// unindexed or internal fields via an unvalidated query string.
const SORTABLE_FIELDS = new Set([
  "productName",
  "productPrice",
  "productSalePrice",
  "productRating",
  "productStock",
  "createdAt",
]);

/**
 * Builds a MongoDB filter object from allowlisted query params.
 * Unknown/unrecognized query params are silently ignored rather than
 * passed through to the DB layer.
 * @param {Object} query - Raw req.query object.
 * @returns {Object} MongoDB filter.
 */
function buildFilter(query: any = {}) {
  const filter: any = {};

  if (query.category) {
    filter.productCategory = query.category;
  }

  if (query.status) {
    filter.productStatus = query.status;
  }

  if (query.inStock !== undefined) {
    filter.productStock = query.inStock === "true" ? { $gt: 0 } : 0;
  }

  if (query.minPrice || query.maxPrice) {
    filter.productPrice = {};
    if (query.minPrice) filter.productPrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.productPrice.$lte = Number(query.maxPrice);
  }

  if (query.tags) {
    filter.tags = { $in: query.tags.split(",").map((t) => t.trim()) };
  }

  if (query.search) {
    filter.$text = { $search: query.search };
  }

  return filter;
}

/**
 * Builds a Mongoose sort string from an allowlisted query param.
 * Accepts comma-separated fields, "-" prefix for descending
 * (e.g. "?sort=-productRating,productPrice").
 * Falls back to newest-first when the param is missing or invalid.
 * @param {string} [sortParam] - Raw req.query.sort value.
 * @returns {string} Mongoose-compatible sort string.
 */
function buildSort(sortParam) {
  if (!sortParam) return "-createdAt";

  const parts = sortParam
    .split(",")
    .map((s) => s.trim())
    .filter((s) => SORTABLE_FIELDS.has(s.replace(/^-/, "")));

  return parts.length > 0 ? parts.join(" ") : "-createdAt";
}

/**
 * Parses and clamps page/limit query params into safe integers.
 * Invalid or missing values fall back to defaults; limit is capped to
 * prevent a client requesting an unbounded page size.
 * @param {Object} query - Raw req.query object.
 * @returns {{ page: number, limit: number, skip: number }}
 */
function buildPagination(query: any = {}) {
  const parsedPage = Number(query.page);
  const parsedLimit = Number(query.limit);

  const page =
    Number.isFinite(parsedPage) && parsedPage > 0 ? Math.floor(parsedPage) : 1;
  const limit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), MAX_PAGE_LIMIT)
      : DEFAULT_PAGE_LIMIT;

  return { page, limit, skip: (page - 1) * limit };
}

/**
 * Service class implementing business logic workflows for Products.
 * Orchestrates validations, ID generation, and delegates data store calls to the Repository.
 */
class ProductService {
  productRepository = null;

  /**
   * Injects ProductRepository dependency.
   * @param {Object} repository - Instance of ProductRepository.
   */
  constructor(repository) {
    this.productRepository = repository;
  }

  /**
   * Validates product input and creates a new product with a generated UUID.
   * @param {Object} data - Input payload containing product fields.
   * @returns {Promise<Object>} The saved product document.
   */
  async createProduct(data) {
    // Validate request data schema asynchronously
    const product = await ProductObject.validateAsync(data);

    // Assign a new v4 UUID to the product
    product.productId = uuidv4();

    return this.productRepository.create(product);
  }

  /**
   * Deletes a product by its custom ID.
   * @param {string} id - The custom productId.
   * @returns {Promise<Object|null>} The deleted document or null.
   */
  deleteProduct(id) {
    return this.productRepository.delete(id);
  }

  /**
   * Validates updated product fields and applies changes to a product.
   * Uses a separate schema (all fields optional) since updates are partial.
   * @param {string} id - The custom productId.
   * @param {Object} data - Payload of updated fields.
   * @returns {Promise<Object|null>} The updated document or null.
   */
  async updateProduct(id, data) {
    // Validate updated data payload fields (partial schema)
    const product = await ProductUpdateObject.validateAsync(data);

    // If either price field is part of this update, guard against
    // sale price exceeding base price. pre('validate') on the model
    // does not run on findOneAndUpdate, so this check happens here.
    if (
      product.productSalePrice !== undefined ||
      product.productPrice !== undefined
    ) {
      const existing = await this.productRepository.findById(id);
      if (!existing) return null;

      const nextPrice = product.productPrice ?? existing.productPrice;
      const nextSalePrice =
        product.productSalePrice ?? existing.productSalePrice;

      if (nextSalePrice > nextPrice) {
        throw new AppError(400, "productSalePrice cannot exceed productPrice");
      }
    }

    return this.productRepository.update(id, product);
  }

  /**
   * Retrieves a single product by its custom ID.
   * @param {string} id - The custom productId.
   * @returns {Promise<Object|null>} The product document or null.
   */
  findProduct(id) {
    return this.productRepository.findById(id);
  }

  /**
   * Retrieves product records, optionally filtered, sorted, and paginated.
   * @param {Object} [query={}] - Raw req.query object (category, status,
   *   inStock, minPrice, maxPrice, tags, search, sort, page, limit).
   * @returns {Promise<{ data: Array, pagination: Object }>}
   */
  async findAllProducts(query: any = {}) {
    const filter = buildFilter(query);
    const sort = buildSort(query.sort);
    const { page, limit, skip } = buildPagination(query);

    const [data, total] = await Promise.all([
      this.productRepository.findAll(filter, sort, skip, limit),
      this.productRepository.count(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  /**
   * Updates a product's image file path in the repository.
   * Stores a public-facing relative path rather than the raw disk path.
   * @param {string} id - The custom productId.
   * @param {Object} file - The file object uploaded via multer.
   * @returns {Promise<Object|null>} The updated document or null.
   */
  uploadProductImage(id, file) {
    const publicPath = `/uploads/${file.filename}`;
    return this.productRepository.update(id, { productImage: publicPath });
  }

  /**
   * Seeds the database with generated mock product data.
   * Clears out any existing records first. Count is clamped to prevent
   * unbounded generation/insertion from an unauthenticated or careless caller.
   * @param {number|string} [count=500] - Number of products to generate.
   * @returns {Promise<string>} Success resolution message.
   */
  async seedProducts(count) {
    const parsed = Number(count);
    const safeCount =
      Number.isFinite(parsed) && parsed > 0
        ? Math.min(Math.floor(parsed), MAX_SEED_COUNT)
        : DEFAULT_SEED_COUNT;

    await this.productRepository.insertMany(generateProducts(safeCount));
    return `Products seeded successfully (${safeCount})`;
  }
}

export default ProductService;

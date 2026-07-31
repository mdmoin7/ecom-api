import { faker } from "@faker-js/faker";
// utils/generateProducts.js

/**
 * Generates a single mock product object using Faker JS.
 * Dynamically computes randomized base prices, sale discounts, stock, rating, and placeholder images.
 * @returns {Object} Mock product details.
 */
function generateProduct() {
  // Generate a random base price between 1000 and 200000
  const price = Number(
    faker.commerce.price({ min: 1000, max: 200000, dec: 0 }),
  );

  // Decide dynamically if product is discounted (50% probability)
  const hasDiscount = faker.datatype.boolean({ probability: 0.5 });
  const discountPercent = hasDiscount
    ? faker.number.int({ min: 5, max: 50 }) // 5% to 50% discount range
    : 0;

  // Calculate product sale price based on discount status
  const sellingPrice = hasDiscount
    ? Number((price * (1 - discountPercent / 100)).toFixed(2))
    : price;

  return {
    // Generate a random alphanumeric string of length 10 as product ID
    productId: faker.string.alphanumeric(10).toUpperCase(),
    productName: faker.commerce.productName(),
    productDescription: faker.commerce.productDescription(),
    productCategory: faker.commerce.department(),
    productPrice: price,
    productSalePrice: sellingPrice,
    productStock: faker.number.int({ min: 0, max: 500 }),
    productRating: Number(
      faker.number.float({ min: 1, max: 5, fractionDigits: 1 }),
    ),
    productImage: faker.image.urlPicsumPhotos(),
    tags: faker.helpers.arrayElements(
      ["new", "sale", "featured", "limited", "trending", "clearance"],
      { min: 0, max: 3 },
    ),
    productStatus: faker.helpers.arrayElement(["active", "inactive"]),
  };
}

/**
 * Creates an array containing a bulk set of mock product objects.
 * @param {number} [count=100] - Total count of product records to create.
 * @returns {Array} List of mock products.
 */
function generateProducts(count = 100) {
  const data = Array.from({ length: count }, generateProduct);
  return data;
}

export { generateProduct, generateProducts };

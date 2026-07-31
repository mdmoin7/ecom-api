import Joi from "joi";

// Full schema — used for create. Required fields enforced here.
export const ProductObject = Joi.object({
  productName: Joi.string().min(2).max(200).required(),
  productDescription: Joi.string().allow("").max(2000),
  productImage: Joi.string().allow(""),
  productPrice: Joi.number().min(0).required(),
  productRating: Joi.number().min(0).max(5),
  productStock: Joi.number().integer().min(0),
  productSalePrice: Joi.number().min(0).required(),
  productCategory: Joi.string().required(),
  productStatus: Joi.string().valid("active", "inactive", "discontinued"),
  tags: Joi.array().items(Joi.string()),
})
  // sale price can't exceed base price, checked at validation time too
  .custom((value, helpers) => {
    if (
      value.productSalePrice !== undefined &&
      value.productPrice !== undefined &&
      value.productSalePrice > value.productPrice
    ) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "productSalePrice cannot exceed productPrice",
  });

// Partial schema — used for update. Every field optional, but validated
// with the same rules (min/max/enum) when present.
export const ProductUpdateObject = Joi.object({
  productName: Joi.string().min(2).max(200),
  productDescription: Joi.string().allow("").max(2000),
  productImage: Joi.string().allow(""),
  productPrice: Joi.number().min(0),
  productRating: Joi.number().min(0).max(5),
  productStock: Joi.number().integer().min(0),
  productSalePrice: Joi.number().min(0),
  productCategory: Joi.string(),
  productStatus: Joi.string().valid("active", "inactive", "discontinued"),
  tags: Joi.array().items(Joi.string()),
}).min(1); // at least one field must be present on update

export default ProductObject;

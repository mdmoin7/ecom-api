import Joi from "joi";

const SignupValidator = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
}).with("password", "confirmPassword");

export { SignupValidator };

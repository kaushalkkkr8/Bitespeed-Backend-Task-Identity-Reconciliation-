import joi from "joi";

export const orderMiddleware = (req, res, next) => {
  const schema = joi
    .object({
      phoneNumber: joi.string().trim().min(4).allow("", null).optional(),
      email: joi.string().trim().email().allow("", null).optional(),
    })
    .or("phoneNumber", "email");

  const { error ,value } = schema.validate(req.body);

  

  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  next();
};

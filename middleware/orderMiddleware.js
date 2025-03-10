import joi from "joi";

export const orderMiddleware = (req, res, next) => {
  const schema = joi
    .object({
    //   phoneNumber: joi.string().trim().min(4).allow("", null).optional(),
    phoneNumber: joi
    .alternatives()
    .try(joi.string().trim().min(4), joi.number()) // Accepts string or number
    .custom((value) => String(value).trim()) // Ensures it's converted to a string and trimmed
    .allow("", null)
    .optional(),
      email: joi.string().trim().email().allow("", null).optional(),
    })
    .or("phoneNumber", "email");

  const { error ,value } = schema.validate(req.body);

  

  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  next();
};

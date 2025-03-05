import joi from 'joi';

export const orderMiddleware = (req, res, next) => {
    const schema = joi.object({
        phoneNumber: joi.string().trim().min(4).optional(),
        email: joi.string().trim().email().optional()
    }).or('phoneNumber', 'email'); // Ensures at least one field is present

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ status: false, message: error.details[0].message });
    }

    next(); // Proceed to the controller if validation passes
};
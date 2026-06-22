const { z } = require('zod');
const { validationError, ValidationError } = require('../utils/errors');


const validateRequest = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        })
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.issues.map((err) => `${err.path.join('.')}: ${err.message}`
            ).join(', ');

            return next(new ValidationError(errorMessages))
        }
        next(error);
    }
}

module.exports = validateRequest;
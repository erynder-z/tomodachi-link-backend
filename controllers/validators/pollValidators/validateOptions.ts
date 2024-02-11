import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'options' field in the request body.
 * Checks if the value is an array with at least two elements.
 * Sends an error message if the value is not an array or has less than two elements.
 *
 * @return {ValidationChain} Express-validator validation chain for 'options'.
 */
export const validateOptions = (): ValidationChain => {
    return body('options', 'Must have at least two options.').isArray({
        min: 2,
    });
};

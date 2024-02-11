import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'description' field in the request body.
 * Checks if the value is a string and optionally escapes it.
 * Sends an error message if the value is not a string.
 *
 * @return {ValidationChain} Express-validator validation chain for 'description'.
 */
export const validateDescription = (): ValidationChain => {
    return body('description', 'Must have at least two options.')
        .isString()
        .escape()
        .optional();
};

import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'question' field in the request body.
 * Checks if the value is a non-empty string and escapes it.
 * Sends an error message if the value is empty or not a string.
 *
 * @return {ValidationChain} Express-validator validation chain for 'question'.
 */
export const validateQuestion = (): ValidationChain => {
    return body('question', 'Question must not be empty.')
        .isString()
        .notEmpty()
        .escape();
};

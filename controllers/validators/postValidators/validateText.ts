import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'newPost' field in the request body.
 * Checks if the value is a non-empty string and escapes it.
 * Sends an error message if the value is empty or not a string.
 *
 * @return {ValidationChain} Express-validator validation chain for 'newPost'.
 */
export const validateText = (): ValidationChain => {
    return body('newPost', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'firstName' field in the request body.
 * Checks if the value is a non-empty string and trims and escapes it.
 * Sends an error message if the value is empty or not a string.
 *
 * @return {ValidationChain} Express-validator validation chain for 'firstName'.
 */
export const validateFirstName = (): ValidationChain => {
    return body('firstName', 'Please enter your name!')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

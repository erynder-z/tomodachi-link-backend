import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'about' field in the request body.
 * Checks if the string is at most 100 characters long.
 * Trims and escapes the string, if it exists.
 * Sends an error message if the string is too long.
 *
 * @return {ValidationChain} Express-validator validation chain for 'lastName'.
 */
export const validateAbout = (): ValidationChain => {
    return body('about', 'Max. 100 characters!')
        .isLength({ max: 100 })
        .trim()
        .escape();
};

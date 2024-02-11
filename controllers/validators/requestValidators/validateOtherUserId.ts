import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'otherUserId' field in the request body.
 * Checks if the value is a non-empty string, a valid MongoDB ObjectId format, and trims and escapes it.
 * Sends an error message if the value is empty, not a valid MongoDB ObjectId format, or not provided.
 *
 * @return {ValidationChain} Express-validator validation chain for 'otherUserId'.
 */
export const validateOtherUserId = (): ValidationChain => {
    return body('otherUserId', 'User id missing.')
        .trim()
        .notEmpty()
        .isMongoId()
        .escape();
};

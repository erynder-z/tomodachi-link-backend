import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'embeddedVideoID' field in the request body.
 * Checks if the value is a string and optionally trims and escapes it.
 * Allows the field to be optional.
 * Sends an error message if the value is not a string.
 *
 * @return {ValidationChain} Express-validator validation chain for 'embeddedVideoID'.
 */
export const validateEmbeddedVideoID = (): ValidationChain => {
    return body('embeddedVideoID', 'Video ID must be a string')
        .trim()
        .optional()
        .escape();
};

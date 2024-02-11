import { check, ValidationChain } from 'express-validator';

/**
 * Custom validator to check if the URL is from Tenor.
 * @param {string} url - The value of the 'gifURL' field.
 * @return {Promise<void>} Promise that resolves if the URL is from Tenor, rejects otherwise.
 */
const isTenorUrl = (url: string) => {
    console.log(url);
    const tenorUrlRegex = /^https:\/\/media\.tenor\.com\/.*$/;
    return tenorUrlRegex.test(url);
};

/**
 * Validates the 'gifURL' field in the request body.
 * Checks if the value is a non-empty URL, matches the Tenor URL pattern, and custom validator.
 * Allows the field to be optional.
 * Sends an error message if the value is empty, not a valid URL, or not from Tenor.
 *
 * @return {ValidationChain} Express-validator validation chain for 'gifURL'.
 */
export const validateGifUrl = (): ValidationChain => {
    return check('gifURL')
        .optional()
        .notEmpty()
        .withMessage('URL is required')
        .isURL()
        .withMessage('Invalid URL')
        .custom((value) => {
            if (!isTenorUrl(value)) {
                return Promise.reject(
                    'Gif URL must be from https://media.tenor.com'
                );
            }
            return true;
        });
};

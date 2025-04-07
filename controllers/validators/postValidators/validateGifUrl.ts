import { check, ValidationChain } from 'express-validator';

/**
 * Custom validator to check if the URL is from Giphy.
 * @param {string} url - The value of the 'gifURL' field.
 * @return {Promise<void>} Promise that resolves if the URL is from Giphy, rejects otherwise.
 */
const isGiphyUrl = (url: string) => {
    const GiphyUrlRegex = /^https:\/\/media\.giphy\.com\/.*$/;
    return GiphyUrlRegex.test(url);
};

/**
 * Validates the 'gifURL' field in the request body.
 * Checks if the value is a non-empty URL, matches the Giphy URL pattern, and custom validator.
 * Allows the field to be optional.
 * Sends an error message if the value is empty, not a valid URL, or not from Giphy.
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
            if (!isGiphyUrl(value)) {
                return Promise.reject(
                    'Gif URL must be from https://media.giphy.com'
                );
            }
            return true;
        });
};

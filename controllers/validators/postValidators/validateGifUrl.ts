import { check } from 'express-validator';

const isTenorUrl = (url: string) => {
    console.log(url);
    const tenorUrlRegex = /^https:\/\/media\.tenor\.com\/.*$/;
    return tenorUrlRegex.test(url);
};

export const validateGifUrl = () => {
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

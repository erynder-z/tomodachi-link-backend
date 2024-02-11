import { body, ValidationChain } from 'express-validator';

/**
 * Validates the image file uploaded in the request body.
 * Checks if the uploaded file exists, its mimetype starts with 'image/', and returns a clean file object if validation passes.
 * Rejects the promise with an error message if the file type is invalid.
 *
 * @return {ValidationChain} Express-validator validation chain for image file.
 */
export const validateImage = (): ValidationChain => {
    return body('image').custom((value, { req }) => {
        if (req.file) {
            const file = req.file;
            if (file.mimetype.startsWith('image/')) {
                const cleanFile = {
                    buffer: file.buffer,
                    mimetype: file.mimetype,
                    size: file.size,
                };
                return cleanFile;
            } else {
                return Promise.reject('Invalid file type!');
            }
        }
        return true;
    });
};

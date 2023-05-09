import { body } from 'express-validator';

export const validateEmbeddedVideoID = () => {
    return body('embeddedVideoID', 'Video ID must be a string')
        .trim()
        .optional()
        .escape();
};

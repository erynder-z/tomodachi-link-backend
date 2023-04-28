import { body } from 'express-validator';

export const validateCurrentUserId = () => {
    return body('currentUserId', 'User id missing.')
        .trim()
        .notEmpty()
        .isMongoId()
        .escape();
};

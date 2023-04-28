import { body } from 'express-validator';

export const validateOtherUserId = () => {
    return body('otherUserId', 'User id missing.')
        .trim()
        .notEmpty()
        .isMongoId()
        .escape();
};

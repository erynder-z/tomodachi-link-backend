import { body } from 'express-validator';

export const validateText = () => {
    return body('newPost', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

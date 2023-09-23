import { body } from 'express-validator';

export const validateQuestion = () => {
    return body('question', 'Question must not be empty.')
        .isString()
        .notEmpty()
        .escape();
};

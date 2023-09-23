import { body } from 'express-validator';

export const validateDescription = () => {
    return body('description', 'Must have at least two options.')
        .isString()
        .escape()
        .optional();
};

import { body } from 'express-validator';

export const validateFirstName = () => {
    return body('first_name', 'Please enter your name!')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

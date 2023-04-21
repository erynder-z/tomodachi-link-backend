import { body } from 'express-validator';

export const validateFirstName = () => {
    return body('firstName', 'Please enter your name!')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

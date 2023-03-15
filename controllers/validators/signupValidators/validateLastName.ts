import { body } from 'express-validator';

export const validateLastName = () => {
    return body('last_name', 'Please enter your name!')
        .trim()
        .isLength({ min: 1 })
        .escape();
};

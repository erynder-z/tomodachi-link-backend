import { body } from 'express-validator';

export const validateConfirmPassword = () => {
    return body('confirmPassword', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.password
    );
};

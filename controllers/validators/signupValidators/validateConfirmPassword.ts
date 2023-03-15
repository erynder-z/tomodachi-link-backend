import { body } from 'express-validator';

export const validateConfirmPassword = () => {
    return body('confirm_password', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.password
    );
};

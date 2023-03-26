import { body } from 'express-validator';

export const validateConfirmNewPassword = () => {
    return body('confirm_new_password', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.new_password
    );
};

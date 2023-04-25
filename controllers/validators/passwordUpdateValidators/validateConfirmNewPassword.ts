import { body } from 'express-validator';

export const validateConfirmNewPassword = () => {
    return body('confirmNewPassword', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.newPassword
    );
};

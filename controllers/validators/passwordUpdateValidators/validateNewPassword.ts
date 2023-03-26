import { body } from 'express-validator';

export const validateNewPassword = () => {
    return body(
        'new_password',
        'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    )
        .trim()
        .isStrongPassword()
        .escape();
};

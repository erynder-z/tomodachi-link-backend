import { body } from 'express-validator';

export const validatePassword = () => {
    return body(
        'password',
        'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    )
        .trim()
        .isStrongPassword();
};

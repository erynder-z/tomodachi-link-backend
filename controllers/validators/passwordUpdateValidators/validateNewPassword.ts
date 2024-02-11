import { body, ValidationChain } from 'express-validator';

/**
 * Validates the new password.
 * Ensures that the new password meets the criteria of being strong.
 * Sends an error message if the new password does not meet the criteria.
 *
 * @return {ValidationChain} Express-validator validation chain for the new password.
 */
export const validateNewPassword = (): ValidationChain => {
    return body(
        'newPassword',
        'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    )
        .trim()
        .isStrongPassword()
        .escape();
};

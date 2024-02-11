import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'password' field in the request body.
 * Checks if the value meets strong password criteria.
 *
 * @return {ValidationChain} Express-validator validation chain for 'password'.
 */
export const validatePassword = (): ValidationChain => {
    return body(
        'password',
        'Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, one number, and one symbol.'
    )
        .trim()
        .isStrongPassword();
};

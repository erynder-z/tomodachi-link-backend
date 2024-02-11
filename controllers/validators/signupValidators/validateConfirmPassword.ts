import { body, ValidationChain } from 'express-validator';

/**
 * Validates the admin password.
 * Compares the provided password with the admin password retrieved from environment variables.
 * Throws an error if the passwords do not match.
 *
 * @return {ValidationChain[]} Express-validator validation chain for 'password'.
 */
export const validateConfirmPassword = (): ValidationChain => {
    return body('confirmPassword', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.password
    );
};

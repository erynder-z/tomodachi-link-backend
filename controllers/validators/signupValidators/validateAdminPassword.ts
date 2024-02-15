import { body, ValidationChain } from 'express-validator';

const adminPassword = process.env.ADMIN_PASSWORD;

/**
 * Validates the admin password.
 * Compares the provided password with the admin password retrieved from environment variables.
 * Throws an error if the passwords do not match.
 *
 * @returns {ValidationChain[]} Express-validator validation chain for 'password'.
 */
export const validateAdminPassword = (): ValidationChain[] => {
    return [
        body('password').custom((value, { req }) => {
            if (value !== adminPassword) {
                throw new Error('Invalid admin password');
            }
            return true;
        }),
    ];
};

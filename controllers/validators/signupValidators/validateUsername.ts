import { ValidationChain, body } from 'express-validator';
import user from '../../../models/user.js';

/**
 * Validates the 'username' field in the request body.
 * Checks if the value is a non-empty alphanumeric string with optional hyphens and if it's not already in use.
 * Sends an error message if the username is invalid or already in use.
 *
 * @return {ValidationChain} Express-validator validation chain for 'username'.
 */
export const validateUsername = (): ValidationChain => {
    return body('username', 'Username must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape()
        .custom(async (username: string) => {
            try {
                if (!/^[a-zA-Z0-9-]+$/.test(username)) {
                    return Promise.reject(
                        'Username must be alphanumeric and can contain hyphens.'
                    );
                }
                const alreadyExistingUsername = await user.findOne({
                    username: username,
                });

                if (alreadyExistingUsername) {
                    return Promise.reject('Username already in use');
                }
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(
                    'Something went wrong when validating username'
                );
            }
        });
};

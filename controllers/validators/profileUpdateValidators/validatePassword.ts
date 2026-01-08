import { body, ValidationChain } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../../../models/user.js';

/**
 * Validates the 'password' field in the request body.
 * Checks if the value is a non-empty string and if it matches the user's current password.
 * Sends an error message if the value is empty, doesn't match the current password, or if there's an error.
 *
 * @return {ValidationChain} Express-validator validation chain for 'password'.
 */
export const validatePassword = (): ValidationChain => {
    return body('password', 'Password is required!')
        .trim()
        .isLength({ min: 1 })
        .custom(async (password: string, { req }) => {
            try {
                const authUserId = req.user._id;
                const user = await User.findById(authUserId);
                if (!user) {
                    throw new Error('User not found');
                }
                const passwordMatches = await bcrypt.compare(
                    password,
                    user.password
                );
                if (!passwordMatches) {
                    return Promise.reject('Wrong password');
                }
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(
                    'Something went wrong when checking password'
                );
            }
        });
};

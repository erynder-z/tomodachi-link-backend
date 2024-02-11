import { body, ValidationChain } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../../../models/user';

/**
 * Validates the current password entered by the user.
 * Checks if the provided current password matches the password stored in the database for the authenticated user.
 * Sends an error message if the current password is incorrect.
 *
 * @return {ValidationChain} Express-validator validation chain for the current password.
 */
export const validateCurrentPassword = (): ValidationChain => {
    return body('currentPassword', 'Enter your current password!')
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
                    return Promise.reject('Current password is wrong!');
                }
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(
                    'Something went wrong when checking password'
                );
            }
        });
};

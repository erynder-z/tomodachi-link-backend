import { body, ValidationChain } from 'express-validator';
import User from '../../../models/user';

/**
 * Validates the 'email' field in the request body.
 * Checks if the value is a valid email format and if it's not already in use.
 * Allows the field to be optional.
 * Sends an error message if the email is invalid or already in use.
 *
 * @return {ValidationChain} Express-validator validation chain for 'email'.
 */
export const validateEmail = (): ValidationChain => {
    return body('email', 'Email is required!')
        .isEmail()
        .custom(async (email: string, { req }) => {
            try {
                const alreadyExistingEmail = await User.findOne({
                    email: email,
                    _id: { $ne: req.user._id },
                });

                if (alreadyExistingEmail) {
                    return Promise.reject('Email already in use');
                }

                return Promise.resolve();
            } catch (err) {
                return Promise.reject(
                    'Something went wrong when validating email'
                );
            }
        });
};

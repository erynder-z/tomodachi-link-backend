import { body } from 'express-validator';
import User from '../../../models/user';

export const validateEmail = () => {
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

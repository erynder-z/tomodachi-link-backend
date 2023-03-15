import { body } from 'express-validator';
import user from '../../../models/user';

export const validateEmail = () => {
    return body('email', 'Email is required!')
        .isEmail()
        .custom(async (email: string) => {
            try {
                const alreadyExistingEmail = await user.findOne({
                    email: email,
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

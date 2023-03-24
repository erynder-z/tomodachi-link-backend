import { body } from 'express-validator';
import bcrypt from 'bcrypt';
import User from '../../../models/user';

export const validatePassword = () => {
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

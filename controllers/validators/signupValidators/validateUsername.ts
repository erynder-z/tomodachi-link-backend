import { body } from 'express-validator';
import user from '../../../models/user';

export const validateUsername = () => {
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

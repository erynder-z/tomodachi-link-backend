import { body } from 'express-validator';

const adminPassword = process.env.ADMIN_PASSWORD;

export const validateAdminPassword = () => {
    return [
        body('password').custom((value, { req }) => {
            if (value !== adminPassword) {
                throw new Error('Invalid admin password');
            }
            return true;
        }),
    ];
};

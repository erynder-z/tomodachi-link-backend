import { body } from 'express-validator';

export const validateIsFriendOnly = () => {
    return body('isFriendOnly', 'Must be a boolean.').isBoolean();
};

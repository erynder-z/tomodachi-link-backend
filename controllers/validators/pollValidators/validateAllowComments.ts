import { body } from 'express-validator';

export const validateAllowComments = () => {
    return body('allowComments', 'Must be a boolean.').isBoolean();
};

import { body } from 'express-validator';

export const validateNumberOfOptions = () => {
    return body('numberOfOptions', 'Must be a number.').trim().isInt().escape();
};

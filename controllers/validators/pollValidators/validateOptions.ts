import { body } from 'express-validator';

export const validateOptions = () => {
    return body('options', 'Must have at least two options.').isArray({
        min: 2,
    });
};

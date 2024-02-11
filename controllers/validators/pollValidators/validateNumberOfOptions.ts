import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'numberOfOptions' field in the request body.
 * Checks if the value is a number.
 * Sends an error message if the value is not a number.
 *
 * @return {ValidationChain} Express-validator validation chain for 'numberOfOptions'.
 */
export const validateNumberOfOptions = (): ValidationChain => {
    return body('numberOfOptions', 'Must be a number.').trim().isInt().escape();
};

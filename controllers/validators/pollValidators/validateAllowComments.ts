import { body,ValidationChain } from 'express-validator';

/**
 * Validates the 'allowComments' field in the request body.
 * Checks if the value is a boolean.
 * Sends an error message if the value is not a boolean.
 *
 * @return {ValidationChain} Express-validator validation chain for 'allowComments'.
 */
export const validateAllowComments = ():ValidationChain => {
    return body('allowComments', 'Must be a boolean.').isBoolean();
};

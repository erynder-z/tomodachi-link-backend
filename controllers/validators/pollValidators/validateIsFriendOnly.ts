import { body, ValidationChain } from 'express-validator';

/**
 * Validates the 'isFriendOnly' field in the request body.
 * Checks if the value is a boolean.
 * Sends an error message if the value is not a boolean.
 *
 * @return {ValidationChain} Express-validator validation chain for 'isFriendOnly'.
 */
export const validateIsFriendOnly = (): ValidationChain => {
    return body('isFriendOnly', 'Must be a boolean.').isBoolean();
};

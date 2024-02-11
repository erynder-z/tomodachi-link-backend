import { body, ValidationChain } from 'express-validator';

/**
 * Validates the confirmation of the new password.
 * Checks if the value of 'confirmNewPassword' matches the value of 'newPassword' in the request body.
 * Sends an error message if the passwords do not match.
 *
 * @return {ValidationChain} Express-validator validation chain for confirming the new password.
 */
export const validateConfirmNewPassword = (): ValidationChain => {
    return body('confirmNewPassword', 'Passwords do not match.').custom(
        (value: string, { req }) => value === req.body.newPassword
    );
};

import { body, ValidationChain } from 'express-validator';

const validCoverImageNames = [
    'none',
    'cover1',
    'cover2',
    'cover3',
    'cover4',
    'cover5',
    'cover6',
    'cover7',
    'cover8',
    'cover9',
    'cover10',
    'cover11',
    'cover12',
];

/**
 * Validates the cover image name received in the request body.
 * Ensures the cover image name is not empty and is one of the valid predefined cover names.
 *
 * @return {ValidationChain} Express-validator validation chain for cover image name.
 */
export const validateCoverImageName = (): ValidationChain => {
    return body('coverImageName', 'Invalid cover name')
        .trim()
        .notEmpty()
        .escape()
        .isIn(validCoverImageNames);
};

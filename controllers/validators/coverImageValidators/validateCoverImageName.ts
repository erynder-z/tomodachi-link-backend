import { body } from 'express-validator';
import { CoverType } from '../../../types/coverType';

const validCoverImageNames: CoverType[] = [
    'cover1',
    'cover2',
    'cover3',
    'cover4',
    'cover5',
    'cover6',
    'cover7',
    'cover8',
    'cover9',
];

export const validateCoverImageName = () => {
    return body('coverImageName', 'Invalid cover name')
        .trim()
        .notEmpty()
        .escape()
        .isIn(validCoverImageNames);
};

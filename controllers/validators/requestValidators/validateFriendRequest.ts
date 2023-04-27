import { body } from 'express-validator';

export const validateFriendRequest = () => [
    body('currentUserId', 'User id missing.')
        .trim()
        .notEmpty()
        .isMongoId()
        .escape(),
    body('otherUserId', 'User id missing.')
        .trim()
        .notEmpty()
        .isMongoId()
        .escape(),
];

import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { UserModelType } from '../models/user';
import { validateEmail } from './validators/profileUpdateValidators/validateEmail';
import { validateFirstName } from './validators/profileUpdateValidators/validateFirstName';
import { validateLastName } from './validators/profileUpdateValidators/validateLastName';
import bcrypt from 'bcrypt';
import { validateCurrentPassword } from './validators/passwordUpdateValidators/validateCurrentPassword';
import { validateNewPassword } from './validators/passwordUpdateValidators/validateNewPassword';
import { validateConfirmNewPassword } from './validators/passwordUpdateValidators/validateConfirmNewPassword';
import { JwtUser } from '../types/jwtUser';
import { validateCoverImageName } from './validators/imageValidators/validateCoverImageName';
import { validateAbout } from './validators/profileUpdateValidators/validateAbout';

/**
 * Asynchronous function to retrieve user data from the request object and send it as a JSON response, or handle errors by calling the next function.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} Promise that resolves with the user data
 */
const getUserData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        if (!req.user) {
            const ERROR_MESSAGE = 'User not found';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const reqUser = req.user as JwtUser;
        const id = reqUser._id;

        await User.findByIdAndUpdate(id, { lastSeen: new Date() });

        const user = await User.findOne({ _id: id }, { password: 0 }).lean();

        if (!user) {
            const ERROR_MESSAGE = 'User not found';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        return res.status(200).json({ user });
    } catch (err) {
        return next(err);
    }
};

/**
 * Validates the first name, last name, and email, then updates user data if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the user data is updated or rejects with an error.
 */
const updateUserData = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validateAbout(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        let userpic;

        if (req.file) {
            userpic = {
                data: req.file.buffer,
                contentType: req.file.mimetype,
            };
        }

        const reqUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            about: req.body.about,
            userpic,
        });

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to update user!';

            res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        if (req.user) {
            const user = req.user as UserModelType;
            const id = user._id;
            try {
                const updateData: any = {
                    firstName: req.body.firstName,
                    lastName: req.body.lastName,
                    email: req.body.email,
                    about: req.body.about,
                };
                if (userpic) {
                    updateData.userpic = userpic;
                }
                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    updateData,
                    { new: true }
                );
                res.status(200).json(updatedUser);
            } catch (err) {
                return next(err);
            }
        }
    },
];

/**
 * Validates the current password, new password, and confirms the new password, then updates the user password if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the user password is updated or rejects with an error.
 */
const updateUserPassword = [
    validateCurrentPassword(),
    validateNewPassword(),
    validateConfirmNewPassword(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const reqUser = new User({
            password: req.body.newPassword,
        });

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to update user!';

            res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(reqUser.password, 10);
            reqUser.password = hashedPassword;

            if (req.user) {
                const user = req.user as UserModelType;
                const id = user._id;

                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    { password: hashedPassword },
                    { new: true }
                );

                res.status(200).json(updatedUser);
            }
        } catch (err) {
            return next(err);
        }
    },
];

/**
 * Validates the cover image name and updates the user's cover image if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the user's cover image is updated or rejects with an error.
 */
const updateCover = [
    validateCoverImageName(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const reqUser = new User({
            cover: req.body.coverImageName,
        });

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to update cover!';

            res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
                reqUser,
            });

            return;
        }

        if (req.user) {
            const user = req.user as UserModelType;
            const id = user._id;
            try {
                const updateData: any = {
                    cover: req.body.coverImageName,
                };

                const updatedUser = await User.findByIdAndUpdate(
                    id,
                    updateData,
                    { new: true }
                );
                res.status(200).json(updatedUser);
            } catch (err) {
                return next(err);
            }
        }
    },
];

/**
 * Counts the number of users and returns the count in a JSON response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} the JSON response with the number of users
 */
const countUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const numberOfUsers = await User.countDocuments();
        return res.status(200).json({ numberOfUsers });
    } catch (err) {
        return next(err);
    }
};

const getUserById = async (id: string): Promise<UserModelType> => {
    const user = await User.findById(id);
    if (!user) {
        const ERROR_MESSAGE = 'User not found';

        throw new Error(ERROR_MESSAGE);
    }
    return user;
};

/**
 * Handles saving the friend relationship between two users.
 *
 * @param {UserModelType} currentUser - the current user to add the friend to
 * @param {UserModelType} otherUser - the other user to add as a friend
 * @return {Promise<void>} a promise that resolves when the operation is complete
 */
const handleSaveDefaultFriend = async (
    currentUser: UserModelType,
    otherUser: UserModelType
): Promise<void> => {
    currentUser.friends.push(otherUser._id);
    otherUser.friends.push(currentUser._id);

    currentUser.pendingFriendRequests =
        currentUser.pendingFriendRequests.filter(
            (userId) => userId.toString() !== otherUser._id.toString()
        );
    otherUser.pendingFriendRequests = otherUser.pendingFriendRequests.filter(
        (userId) => userId.toString() !== currentUser._id.toString()
    );

    await Promise.all([currentUser.save(), otherUser.save()]);
};

/**
 * Function to add a default friend for the current user.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {void}
 */
const addDefaultFriend = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user) {
        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const defaultFriendId = process.env.DEFAULT_FRIEND_ID;
        if (defaultFriendId) {
            try {
                const [currentUser, otherUser] = await Promise.all([
                    getUserById(currentUserId),
                    getUserById(defaultFriendId),
                ]);

                await handleSaveDefaultFriend(currentUser, otherUser);

                res.status(200).json({});
            } catch (err) {
                return next(err);
            }
        }
    }
};

/**
 * Middleware function to update user's acceptance of terms of service.
 *
 * @param {Request} req - the incoming request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 */
const acceptTOS = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const user = req.user as UserModelType;
        const id = user._id;
        try {
            const updateData = {
                hasAcceptedTOS: true,
            };

            const updatedUser = await User.findByIdAndUpdate(id, updateData, {
                new: true,
            });
            res.status(200).json(updatedUser);
        } catch (err) {
            return next(err);
        }
    }
};

export {
    getUserData,
    updateUserData,
    updateUserPassword,
    updateCover,
    countUsers,
    addDefaultFriend,
    acceptTOS,
};

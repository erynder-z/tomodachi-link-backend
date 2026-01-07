import { Request, Response, NextFunction } from 'express';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { FriendType } from '../types/friendType';
import { validateOtherUserId } from './validators/requestValidators/validateOtherUserId';
import { MinimalUserTypes } from '../types/minimalUserTypes';

/**
 * Counts the number of users and returns the count in a JSON response with status 200.
 *
 * @param {Request} _req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} JSON response with the number of users and status 200
 */
const countUsers = async (
    _req: Request,
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

/**
 * Get some users based on certain criteria.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} Promise that resolves with a list of users.
 */
const getSomeUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    const jwtUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(jwtUser._id);

        if (!currentUser) {
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        const friends = currentUser.friends.map((friend) => friend.toString());

        const userList = await User.aggregate([
            {
                $match: {
                    _id: { $nin: [currentUser._id, ...friends] },
                    friends: { $nin: [currentUser._id] },
                },
            },
            { $sample: { size: 12 } },
            { $project: { _id: 1, firstName: 1, lastName: 1, userpic: 1 } },
        ]);

        return res.status(200).json({ userList });
    } catch (err) {
        return next(err);
    }
};

/**
 * Retrieves a list of users with minimal data based on the provided request parameters.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves when the user list is successfully retrieved
 */
const getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const BATCH_SIZE = 12;
    const jwtUser = req.user as JwtUser;
    const currentUserId = jwtUser._id;

    try {
        const [currentUser, userList] = await Promise.all([
            User.findById(currentUserId),
            User.find({ _id: { $ne: currentUserId } })
                .select('_id firstName lastName userpic')
                .skip(skip)
                .limit(BATCH_SIZE)
                .lean()
                .exec(),
        ]);

        if (!currentUser) {
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const minimalUserList: MinimalUserTypes[] = userList.map(
            (user: UserModelType) => ({
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                userpic: user.userpic,
            })
        );

        res.status(200).json({ userList: minimalUserList });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves a list of friends of friends for the current user.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} a Promise that resolves with the friends of friends list
 */
const getSomeFriendsOfFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    const jwtUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(jwtUser._id);
        if (!currentUser) {
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        const currentUserFriends = currentUser.friends.map((friend) =>
            friend.toString()
        );

        const friendsOfFriendsSet = new Set<string>();

        await Promise.all(
            currentUserFriends.map(async (friend) => {
                const currentFriend = await User.findById(friend);
                if (currentFriend) {
                    currentFriend.friends.forEach((friendOfFriend) =>
                        friendsOfFriendsSet.add(friendOfFriend.toString())
                    );
                }
            })
        );

        const friendsOfFriendsArray = Array.from(friendsOfFriendsSet);
        const shuffledFriendsOfFriends = shuffleArray(friendsOfFriendsArray);

        const arrayOfSixFriendsOfFriends = shuffledFriendsOfFriends
            .filter((friend) => !currentUserFriends.includes(friend))
            .slice(0, 6)
            .map((friend) => new mongoose.Types.ObjectId(friend));

        const friendsOfFriends = await User.aggregate([
            {
                $match: {
                    _id: {
                        $in: arrayOfSixFriendsOfFriends,
                        $nin: [currentUser._id],
                    },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'friends',
                    foreignField: '_id',
                    as: 'friendsOfFriends',
                },
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    userpic: 1,
                    commonFriends: {
                        $map: {
                            input: '$friendsOfFriends',
                            as: 'friend',
                            in: {
                                _id: '$$friend._id',
                                firstName: '$$friend.firstName',
                                lastName: '$$friend.lastName',
                            },
                        },
                    },
                },
            },
        ]);

        return res.status(200).json({ friendsOfFriends });
    } catch (err) {
        return next(err);
    }
};

/**
 * Shuffles the elements of the input array in place.
 *
 * @param {any[]} array - The array to be shuffled
 * @return {any[]} - The shuffled array
 */
const shuffleArray = (array: any[]): any[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

/**
 * Asynchronous function to get other user data.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves with the other user data
 */
const getOtherUserData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const [otherUser, currentUser] = await Promise.all([
            User.findById(req.params.id),
            User.findById((req.user as JwtUser)._id),
        ]);

        if (!otherUser || !currentUser) {
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        const isFriend = otherUser.friends.includes(currentUser._id);
        const isIncomingFriendRequestPending =
            currentUser.pendingFriendRequests.includes(otherUser._id);
        const isOutgoingFriendRequestPending =
            otherUser.pendingFriendRequests.includes(currentUser._id);

        let friends: FriendType[] = [];
        let mutualFriends = 0;

        if (isFriend) {
            const [friendObjects, sameFriends] = await Promise.all([
                getFriendData(otherUser),
                getMutualFriends(
                    otherUser._id.toString(),
                    currentUser._id.toString()
                ),
            ]);

            friends = friendObjects;
            mutualFriends = sameFriends;
        }

        const userObj = formatUserData(
            otherUser,
            isFriend,
            friends,
            mutualFriends
        );

        res.status(200).json({
            user: userObj,
            isFriend,
            isIncomingFriendRequestPending,
            isOutgoingFriendRequestPending,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves friend data for a given user.
 *
 * @param {UserModelType} user - The user for whom to retrieve friend data
 * @return {Promise<FriendType[]>} An array of friend objects
 */
const getFriendData = async (user: UserModelType): Promise<FriendType[]> => {
    const friendObjects = await User.aggregate([
        {
            $match: {
                _id: { $in: user.friends },
            },
        },
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                userpic: 1,
                cover: 1,
            },
        },
    ]);

    return friendObjects;
};

/**
 * Retrieves the mutual friends between two users.
 *
 * @param {string} userId - The ID of the user
 * @param {string} otherUserId - The ID of the other user
 * @return {Promise<number>} The number of mutual friends
 */
const getMutualFriends = async (
    userId: string,
    otherUserId: string
): Promise<number> => {
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!user || !otherUser) {
        return 0;
    }

    const userFriends = new Set(
        user.friends.map((friend) => friend.toString())
    );
    let mutualFriends = 0;
    for (const friend of otherUser.friends) {
        if (userFriends.has(friend.toString())) {
            mutualFriends++;
        }
    }
    return mutualFriends;
};

/**
 * Formats the user data and returns a user object with modified userpic data if necessary.
 *
 * @param {UserModelType} user - the user data to be formatted
 * @param {boolean} isFriend - indicates if the user is a friend
 * @param {FriendType[]} friends - the list of friends
 * @param {number} mutualFriends - the number of mutual friends
 * @return {object} the formatted user object
 */
const formatUserData = (
    user: UserModelType,
    isFriend: boolean,
    friends: FriendType[],
    mutualFriends: number
): object => {
    const {
        _id,
        firstName,
        lastName,
        about,
        userpic,
        cover,
        joined,
        lastSeen,
    } = user;

    const userObj = {
        _id,
        firstName,
        lastName,
        about,
        // change userpic.data to correct format
        userpic: {
            data: Buffer.from(userpic.data).toString('base64'),
            contentType: userpic.contentType,
        },
        cover,
        ...(isFriend && { joined, lastSeen, friends, mutualFriends }),
    };

    return userObj;
};

/**
 * Validates the other user ID and sends a friend request if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the friend request is sent or rejects with an error.
 */
const sendFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const jwtUser = req.user as JwtUser;
        const currentUserID = jwtUser._id;
        const otherUserID = req.body.otherUserId;

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to send friend request!';

            res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
            });

            return;
        }

        try {
            const updatedUser = await User.findOneAndUpdate(
                {
                    _id: otherUserID,
                    pendingFriendRequests: { $ne: currentUserID },
                },
                { $push: { pendingFriendRequests: currentUserID } },
                { new: true }
            );

            if (!updatedUser) {
                const ERROR_MESSAGE = 'Could not send friend request!';

                return res.status(406).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            res.status(200).json();
        } catch (err) {
            return next(err);
        }
    },
];

/**
 * Checks if the current user can handle the friend request from another user.
 *
 * @param {UserModelType} currentUser - the current user
 * @param {UserModelType} otherUser - the other user
 * @return {boolean} indicates if the current user can handle the friend request
 */
const canHandleFriendRequest = (
    currentUser: UserModelType,
    otherUser: UserModelType
): boolean => {
    return (
        currentUser?.pendingFriendRequests.includes(otherUser._id) &&
        !otherUser?.friends.includes(currentUser._id)
    );
};

/**
 * Handles friend request for users.
 *
 * @param {UserModelType} currentUser - the current user object
 * @param {UserModelType} otherUser - the other user object
 * @param {'accept' | 'decline'} typeOfRequest - the type of request, either 'accept' or 'decline'
 * @return {Promise<void>} a Promise that resolves when the function completes
 */
const handleFriendRequestForUsers = async (
    currentUser: UserModelType,
    otherUser: UserModelType,
    typeOfRequest: 'accept' | 'decline'
): Promise<void> => {
    if (typeOfRequest === 'accept') {
        if (!currentUser.friends.includes(otherUser._id)) {
            currentUser.friends.push(otherUser._id);
        }

        if (!otherUser.friends.includes(currentUser._id)) {
            otherUser.friends.push(currentUser._id);
        }
    }

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
 * Validates the other user ID and accepts a friend request if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the friend request is accepted or rejects with an error.
 */
const acceptFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to accept friend request!';

            return res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
            });
        }

        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const otherUserId = req.body.otherUserId;

        try {
            const [currentUser, otherUser] = await Promise.all([
                getUserById(currentUserId),
                getUserById(otherUserId),
            ]);

            if (!canHandleFriendRequest(currentUser, otherUser)) {
                const ERROR_MESSAGE = 'Could not accept friend request!';
                return res.status(406).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            await handleFriendRequestForUsers(currentUser, otherUser, 'accept');

            return res.status(200).json({});
        } catch (err) {
            return next(err);
        }
    },
];

/**
 * Retrieves a user by their ID.
 *
 * @param {string} id - The ID of the user
 * @return {Promise<UserModelType>} The user object
 */
const getUserById = async (id: string): Promise<UserModelType> => {
    const user = await User.findById(id);
    if (!user) {
        const ERROR_MESSAGE = 'User not found';

        throw new Error(ERROR_MESSAGE);
    }
    return user;
};

const declineFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to decline friend request!';

            return res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
            });
        }

        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const otherUserId = req.body.otherUserId;

        try {
            const [currentUser, otherUser] = await Promise.all([
                getUserById(currentUserId),
                getUserById(otherUserId),
            ]);

            if (!canHandleFriendRequest(currentUser, otherUser)) {
                const ERROR_MESSAGE = 'Could not decline friend request!';

                return res.status(406).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            await handleFriendRequestForUsers(
                currentUser,
                otherUser,
                'decline'
            );

            return res.status(200).json();
        } catch (err) {
            return next(err);
        }
    },
];

/**
 * Validates the other user ID and unfriends the user if validation passes.
 * Handles validation errors and sends appropriate responses.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {Promise<void>} A Promise that resolves once the user is unfriended or rejects with an error.
 */
const unfriendUser = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            const ERROR_MESSAGE = 'Failed to unfriend user!';

            return res.status(400).json({
                message: ERROR_MESSAGE,
                errors: errors.array(),
            });
        }

        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const otherUserId = req.body.otherUserId;

        try {
            const [currentUser, otherUser] = await Promise.all([
                getUserById(currentUserId),
                getUserById(otherUserId),
            ]);

            if (!canUnfriend(currentUser, otherUser)) {
                const ERROR_MESSAGE = 'You are not friends!';

                return res.status(406).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            await removeUserFromFriends(currentUser, otherUser);

            return res.status(200).json();
        } catch (err) {
            return next(err);
        }
    },
];

/**
 * Checks if the current user can unfriend another user.
 *
 * @param {UserModelType} currentUser - The current user
 * @param {UserModelType} otherUser - The other user to check against
 * @return {boolean} Whether the current user can unfriend the other user
 */
const canUnfriend = (
    currentUser: UserModelType,
    otherUser: UserModelType
): boolean => {
    return (
        currentUser?.friends.includes(otherUser._id) &&
        otherUser?.friends.includes(currentUser._id)
    );
};

/**
 * Removes the otherUser from the friends list of the currentUser, and vice versa.
 *
 * @param {UserModelType} currentUser - the current user whose friend needs to be removed
 * @param {UserModelType} otherUser - the user to be removed from the friend list
 * @return {Promise<void>} a Promise that resolves once the users are saved after removing each other from the friend list
 */
const removeUserFromFriends = async (
    currentUser: UserModelType,
    otherUser: UserModelType
): Promise<void> => {
    currentUser.friends = currentUser.friends.filter(
        (userId) => userId.toString() !== otherUser._id.toString()
    );
    otherUser.friends = otherUser.friends.filter(
        (userId) => userId.toString() !== currentUser._id.toString()
    );
    await Promise.all([currentUser.save(), otherUser.save()]);
};

export {
    countUsers,
    getSomeUsers,
    getAllUsers,
    getSomeFriendsOfFriends,
    getOtherUserData,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    unfriendUser,
};

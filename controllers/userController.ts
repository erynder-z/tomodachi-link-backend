import { Request, Response, NextFunction } from 'express';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';
import { FriendType } from '../types/friendType';
import { validateOtherUserId } from './validators/requestValidators/validateOtherUserId';
import { MinimalUserTypes } from '../types/minimalUserTypes';

const countUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const numberOfUsers = await User.countDocuments();
        return res.status(200).json({ numberOfUsers });
    } catch (err) {
        return next(err);
    }
};

const getSomeUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(jwtUser._id);
        if (!currentUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: 'Something went wrong retrieving user data!',
                    },
                ],
            });
        }

        const friends = currentUser.friends.map((friend) => friend.toString());
        const userList = await User.aggregate([
            {
                $match: {
                    _id: {
                        $nin: [
                            currentUser._id,
                            ...friends.map((friend) => friend.toString()),
                        ],
                    },
                    friends: {
                        $nin: [currentUser._id],
                    },
                },
            },
            { $sample: { size: 10 } },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    userpic: 1,
                },
            },
        ]);
        return res.status(200).json({ userList });
    } catch (err) {
        return next(err);
    }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const jwtUser = req.user as JwtUser;
    const currentUserId = jwtUser._id;

    try {
        const currentUser = await User.findById(currentUserId);
        if (!currentUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: 'Something went wrong retrieving user data!',
                    },
                ],
            });
        }

        const userList = await User.find({ _id: { $ne: currentUserId } })
            .select('_id firstName lastName username userpic')
            .skip(skip)
            .limit(10)
            .lean()
            .exec();

        const minimalUserList: MinimalUserTypes[] = userList.map(
            (user: UserModelType) => {
                const minimalUser: MinimalUserTypes = {
                    _id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    username: user.username,
                    userpic: user.userpic,
                };
                return minimalUser;
            }
        );

        res.status(200).json({ userList: minimalUserList });
    } catch (err) {
        next(err);
    }
};

const getSomeFriendsOfFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const jwtUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(jwtUser._id);
        if (!currentUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: 'Something went wrong retrieving user data!',
                    },
                ],
            });
        }

        const currentUserFriends = currentUser.friends.map((friend) =>
            friend.toString()
        );

        const friendsOfFriendsSet = new Set<string>();
        for (const friend of currentUserFriends) {
            const currentFriend = await User.findById(friend);
            if (currentFriend) {
                currentFriend.friends.forEach((friendOfFriend) =>
                    friendsOfFriendsSet.add(friendOfFriend.toString())
                );
            }
        }

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

const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const getOtherUserData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const otherUserPromise = User.findById(req.params.id);
        const jwtUser = req.user as JwtUser;
        const currentUserPromise = User.findById(jwtUser._id);

        const [otherUser, currentUser] = await Promise.all([
            otherUserPromise,
            currentUserPromise,
        ]);

        if (!otherUser || !currentUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: 'Something went wrong retrieving user data!',
                    },
                ],
            });
        }

        const otherUserId = new mongoose.Types.ObjectId(otherUser._id);
        const currentUserId = currentUser._id;

        const isFriend = otherUser.friends.includes(currentUserId);
        const isIncomingFriendRequestPending =
            currentUser.pendingFriendRequests.includes(otherUserId);
        const isOutgoingFriendRequestPending =
            otherUser.pendingFriendRequests.includes(currentUserId);

        let friends: FriendType[] = [];
        let mutualFriends = 0;

        if (isFriend) {
            const [friendObjects, sameFriends] = await Promise.all([
                getFriendData(otherUser),
                getMutualFriends(otherUser._id, currentUser._id),
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

const getFriendData = async (user: UserModelType) => {
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
                username: 1,
                userpic: 1,
                cover: 1,
            },
        },
    ]);

    return friendObjects;
};

const getMutualFriends = async (userId: string, otherUserId: string) => {
    const user = await User.findById(userId);
    const otherUser = await User.findById(otherUserId);

    if (!user || !otherUser) {
        return 0;
    }

    const userFriends = user.friends.map((friend) => friend.toString());
    const otherUserFriends = otherUser.friends.map((friend) =>
        friend.toString()
    );

    return userFriends.filter((friend) => otherUserFriends.includes(friend))
        .length;
};

const formatUserData = (
    user: UserModelType,
    isFriend: boolean,
    friends: FriendType[],
    mutualFriends: number
) => {
    const {
        _id,
        firstName: firstName,
        lastName: lastName,
        username,
        userpic,
        cover,
        joined,
        lastSeen: lastSeen,
    } = user;

    const userObj = {
        _id,
        firstName,
        lastName,
        username,
        userpic: userpic.data,
        cover,
        ...(isFriend && { joined, lastSeen, friends, mutualFriends }),
    };

    return userObj;
};

const sendFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const jwtUser = req.user as JwtUser;
        const currentUserID = jwtUser._id;
        const otherUserID = req.body.otherUserId;

        if (!errors.isEmpty()) {
            res.status(400).json({
                message: 'Failed to send friend request!',
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
                return res.status(406).json({
                    errors: [
                        {
                            message: 'Could not send friend request!',
                        },
                    ],
                });
            }

            res.status(200).json({
                title: 'Friend request sent!',
            });
        } catch (err) {
            return next(err);
        }
    },
];

const canHandleFriendRequest = (
    currentUser: UserModelType,
    otherUser: UserModelType
) => {
    return (
        currentUser?.pendingFriendRequests.includes(otherUser._id) &&
        !otherUser?.friends.includes(currentUser._id)
    );
};

const handleFriendRequestForUsers = async (
    currentUser: UserModelType,
    otherUser: UserModelType,
    typeOfRequest: 'accept' | 'decline'
) => {
    if (typeOfRequest === 'accept') {
        currentUser.friends.push(otherUser._id);
        otherUser.friends.push(currentUser._id);
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

const acceptFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Failed to accept friend request!',
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
                return res.status(406).json({
                    errors: [
                        {
                            message: 'Could not accept friend request!',
                        },
                    ],
                });
            }

            await handleFriendRequestForUsers(currentUser, otherUser, 'accept');

            return res.status(200).json({
                title: 'Friend request accepted!',
            });
        } catch (err) {
            return next(err);
        }
    },
];

const getUserById = async (id: string) => {
    const user = await User.findById(id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

const declineFriendRequest = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Failed decline friend request!',
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
                return res.status(406).json({
                    errors: [
                        {
                            message: 'Could not decline friend request!',
                        },
                    ],
                });
            }

            await handleFriendRequestForUsers(
                currentUser,
                otherUser,
                'decline'
            );

            return res.status(200).json({
                title: 'Friend request declined!',
            });
        } catch (err) {
            return next(err);
        }
    },
];

const unfriendUser = [
    validateOtherUserId(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Failed to unfriend!',
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
                return res.status(406).json({
                    errors: [
                        {
                            message: 'You are not friends!',
                        },
                    ],
                });
            }

            await removeUserFromFriends(currentUser, otherUser);

            return res.status(200).json({
                title: 'You are no longer friends!',
            });
        } catch (err) {
            return next(err);
        }
    },
];

const canUnfriend = (currentUser: UserModelType, otherUser: UserModelType) => {
    return (
        currentUser?.friends.includes(otherUser._id) &&
        otherUser?.friends.includes(currentUser._id)
    );
};

const removeUserFromFriends = async (
    currentUser: UserModelType,
    otherUser: UserModelType
) => {
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

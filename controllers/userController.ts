import { Request, Response, NextFunction } from 'express';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';
import { FriendType } from '../types/friendType';

const getSomeUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const reqUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(reqUser._id);
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
                    first_name: 1,
                    last_name: 1,
                    userpic: 1,
                },
            },
        ]);
        return res.status(200).json({ userList });
    } catch (err) {
        return next(err);
    }
};

const getOtherUserData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const reqUser = req.user as JwtUser;
    const id = req.params.id;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                message: 'Something went wrong retrieving user data!',
            });
        }

        const reqUserId = new mongoose.Types.ObjectId(reqUser._id);
        const isFriend = user.friends.includes(reqUserId);
        const isFriendRequestPending =
            user.pending_friend_requests.includes(reqUserId);

        const friends = isFriend ? await getFriendData(user) : [];

        const userObj = formatUserData(user, isFriend, friends);

        return res.json({
            user: userObj,
            isFriend,
            isFriendRequestPending,
        });
    } catch (err) {
        next(err);
    }
};

const getFriendData = async (user: UserModelType) => {
    const friendObjects = await User.find({
        _id: { $in: user.friends },
    });
    return friendObjects.map(
        ({ _id, first_name, last_name, username, userpic }) => ({
            _id,
            first_name,
            last_name,
            username,
            userpic,
        })
    );
};

const formatUserData = (
    user: UserModelType,
    isFriend: boolean,
    friends: FriendType[]
) => {
    const { _id, first_name, last_name, username, userpic, joined, last_seen } =
        user;

    const userObj = {
        _id,
        first_name,
        last_name,
        username,
        userpic,
        ...(isFriend && { joined, last_seen, friends }),
    };

    return userObj;
};

const sendFriendRequest = [
    body('currentUserId', 'User id missing.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('requestUserId', 'User id missing.')
        .trim()
        .isLength({ min: 1 })
        .escape(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const currentUserID = req.body.currentUserId;
        const requestUserID = req.body.requestUserId;

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
                    _id: requestUserID,
                    pending_friend_requests: { $ne: currentUserID },
                },
                { $push: { pending_friend_requests: currentUserID } },
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

const acceptFriendRequest = [
    body('currentUserId', 'User id missing.').notEmpty().escape(),
    body('requestUserId', 'User id missing.').notEmpty().escape(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Failed accept friend request!',
                errors: errors.array(),
            });
        }

        const { currentUserId, requestUserId } = req.body;

        try {
            const [currentUser, requestUser] = await Promise.all([
                getUserById(currentUserId),
                getUserById(requestUserId),
            ]);

            if (!canAcceptFriendRequest(currentUser, requestUser)) {
                return res.status(406).json({
                    errors: [
                        {
                            message: 'Could not accept friend request!',
                        },
                    ],
                });
            }

            await acceptFriendRequestForUsers(currentUser, requestUser);

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

const canAcceptFriendRequest = (
    currentUser: UserModelType,
    requestUser: UserModelType
) => {
    return (
        currentUser?.pending_friend_requests.includes(requestUser._id) &&
        !requestUser?.friends.includes(currentUser._id)
    );
};

const acceptFriendRequestForUsers = async (
    currentUser: UserModelType,
    requestUser: UserModelType
) => {
    currentUser.friends.push(requestUser._id);
    requestUser.friends.push(currentUser._id);
    currentUser.pending_friend_requests =
        currentUser.pending_friend_requests.filter(
            (userId) => userId.toString() !== requestUser._id.toString()
        );
    requestUser.pending_friend_requests =
        requestUser.pending_friend_requests.filter(
            (userId) => userId.toString() !== currentUser._id.toString()
        );
    await Promise.all([currentUser.save(), requestUser.save()]);
};

const declineFriendRequest = [
    body('currentUserId', 'User id missing.').notEmpty().escape(),
    body('requestUserId', 'User id missing.').notEmpty().escape(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: 'Failed decline friend request!',
                errors: errors.array(),
            });
        }

        const { currentUserId, requestUserId } = req.body;

        try {
            const [currentUser, requestUser] = await Promise.all([
                getUserById(currentUserId),
                getUserById(requestUserId),
            ]);

            if (!canDeclineFriendRequest(currentUser, requestUser)) {
                return res.status(406).json({
                    errors: [
                        {
                            message: 'Could not decline friend request!',
                        },
                    ],
                });
            }

            await declineFriendRequestForUsers(currentUser, requestUser);

            return res.status(200).json({
                title: 'Friend request declined!',
            });
        } catch (err) {
            return next(err);
        }
    },
];

const canDeclineFriendRequest = (
    currentUser: UserModelType,
    requestUser: UserModelType
) => {
    return (
        currentUser?.pending_friend_requests.includes(requestUser._id) &&
        !requestUser?.friends.includes(currentUser._id)
    );
};

const declineFriendRequestForUsers = async (
    currentUser: UserModelType,
    requestUser: UserModelType
) => {
    currentUser.pending_friend_requests =
        currentUser.pending_friend_requests.filter(
            (userId) => userId.toString() !== requestUser._id.toString()
        );
    requestUser.pending_friend_requests =
        requestUser.pending_friend_requests.filter(
            (userId) => userId.toString() !== currentUser._id.toString()
        );
    await Promise.all([currentUser.save(), requestUser.save()]);
};

export {
    getSomeUsers,
    getOtherUserData,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
};

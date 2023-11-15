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
            { $sample: { size: 10 } },
            { $project: { _id: 1, firstName: 1, lastName: 1, userpic: 1 } },
        ]);

        return res.status(200).json({ userList });
    } catch (err) {
        return next(err);
    }
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const BATCH_SIZE = 10;
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

const getSomeFriendsOfFriends = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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

const shuffleArray = (array: any[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const getOtherUserData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
        userpic,
        cover,
        joined,
        lastSeen: lastSeen,
    } = user;

    const userObj = {
        _id,
        firstName,
        lastName,
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

const getUserById = async (id: string) => {
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

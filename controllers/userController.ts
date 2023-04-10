import { Request, Response, NextFunction } from 'express';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { body, validationResult } from 'express-validator';

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
            { $match: { _id: { $nin: [currentUser._id, ...friends] } } },
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

        if (isFriend) {
            return res.json({ user: user, isFriend: true });
        } else {
            const { _id, first_name, last_name, username, userpic } = user;
            return res.json({
                user: {
                    _id,
                    first_name,
                    last_name,
                    username,
                    userpic,
                },
                isFriend: false,
                isFriendRequestPending: isFriendRequestPending,
            });
        }
    } catch (err) {
        next(err);
    }
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

export { getSomeUsers, getOtherUserData, sendFriendRequest };
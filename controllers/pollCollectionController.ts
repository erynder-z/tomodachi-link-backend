import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';
import Poll from '../models/poll';
import User from '../models/user';

const getPaginatedPollCollection = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const BATCH_SIZE = 10;

    try {
        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const currentUser = await User.findById(currentUserId).exec();
        if (!currentUser) {
            const ERROR_MESSAGE = 'User not found';
            throw new Error(ERROR_MESSAGE);
        }

        const friendListIdArray = currentUser.friends.map((friend) =>
            friend.toString()
        );

        const filter = {
            $or: [
                { isFriendOnly: false },
                {
                    $and: [
                        { isFriendOnly: true },
                        {
                            $or: [
                                { owner: { $in: friendListIdArray } },
                                { owner: currentUserId },
                            ],
                        },
                    ],
                },
            ],
        };

        const projection = {
            owner: 1,
            question: 1,
            numberOfOptions: 1,
            options: 1,
            description: 1,
            isFriendOnly: 1,
            allowComments: 1,
            comments: 1,
            createdAt: 1,
            updatedAt: 1,
        };
        const pollCollection = await Poll.find(filter)
            .select(projection)
            .populate({
                path: 'owner',
                select: 'firstName lastName userpic',
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })

            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(BATCH_SIZE)
            .exec();

        res.status(200).json({ pollCollection });
    } catch (error) {
        return next(error);
    }
};

const getSinglePoll = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const pollID = req.params.id;
        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const currentUser = await User.findById(currentUserId).exec();
        if (!currentUser) {
            const ERROR_MESSAGE = 'User not found';
            throw new Error(ERROR_MESSAGE);
        }

        const projection = {
            owner: 1,
            question: 1,
            numberOfOptions: 1,
            options: 1,
            description: 1,
            isFriendOnly: 1,
            allowComments: 1,
            comments: 1,
            createdAt: 1,
            updatedAt: 1,
        };
        const singlePoll = await Poll.findById(pollID)
            .select(projection)
            .populate({
                path: 'owner',
                select: 'firstName lastName userpic',
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })
            .exec();

        if (!singlePoll) {
            throw new Error('Poll not found');
        }

        if (
            !singlePoll.isFriendOnly || // Condition 1: Poll is not "isFriendOnly"
            currentUser.friends.includes(singlePoll.owner) || // Condition 2: Current user is friends with the poll owner
            currentUserId === singlePoll.owner.toString() // Condition 3: Current user is the owner of the poll
        ) {
            res.status(200).json({ singlePoll });
        } else {
            const ERROR_MESSAGE = 'Forbidden';
            res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }
    } catch (error) {
        return next(error);
    }
};

export { getPaginatedPollCollection, getSinglePoll };

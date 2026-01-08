import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser.js';
import Poll from '../models/poll.js';
import User from '../models/user.js';

/**
 * Retrieves a paginated collection of polls based on the provided request parameters.
 *
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 * @param {NextFunction} next - The next middleware function
 * @return {Promise<void>} A Promise that resolves with the paginated poll collection
 */
const getPaginatedPollCollection = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

        const pollCollection = await Poll.find(filter, projection)
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
            .lean()
            .exec();

        res.status(200).json({ pollCollection });
    } catch (error) {
        return next(error);
    }
};

/**
 * Retrieves a single poll based on the provided poll ID and user authentication.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void>} a Promise that resolves to the retrieved single poll
 */
const getSinglePoll = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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
            .lean()
            .exec();

        if (!singlePoll) {
            throw new Error('Poll not found');
        }

        const isFriendOnly = singlePoll.isFriendOnly;
        const isCurrentUserOwner =
            currentUserId === singlePoll.owner.toString();
        const isCurrentUserFriend = currentUser.friends.includes(
            singlePoll.owner._id
        );

        if (!isFriendOnly || isCurrentUserOwner || isCurrentUserFriend) {
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

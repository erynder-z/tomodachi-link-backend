import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';
import Poll from '../models/poll';
import User from '../models/user';

const getPollCollection = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const batchSize = 10;

    try {
        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const currentUser = await User.findById(currentUserId).exec();
        if (!currentUser) {
            throw new Error('User not found');
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
            timestamp: 1,
            question: 1,
            numberOfOptions: 1,
            options: 1,
            description: 1,
            isFriendOnly: 1,
            allowComments: 1,
            comments: 1,
        };
        const pollCollection = await Poll.find(filter)
            .select(projection)
            .populate({
                path: 'owner',
                select: 'username firstName lastName userpic',
            })
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })

            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(batchSize)
            .exec();

        res.status(200).json({ pollCollection });
    } catch (error) {
        return next(error);
    }
};

export { getPollCollection };

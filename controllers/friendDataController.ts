import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';
import User from '../models/user';

const getFriendData = async (
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

        const friends = currentUser.friends.map((friend) => friend);

        const friendDataList = await User.aggregate([
            {
                $match: {
                    _id: {
                        $in: friends,
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    first_name: 1,
                    last_name: 1,
                    email: 1,
                    joined: 1,
                    last_seen: 1,
                    userpic: 1,
                },
            },
        ]);

        console.log('friendDataList', friendDataList);
        return res.status(200).json({ friendDataList });
    } catch (err) {
        return next(err);
    }
};

export { getFriendData };

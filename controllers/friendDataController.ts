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
            const ERROR_MESSAGE = 'Something went wrong retrieving user data!';
            return res.status(404).json({
                errors: [
                    {
                        message: ERROR_MESSAGE,
                    },
                ],
            });
        }

        const friendDataList = await User.aggregate([
            {
                $match: {
                    _id: {
                        $in: currentUser.friends,
                    },
                },
            },
            {
                $project: {
                    _id: 1,
                    firstName: 1,
                    lastName: 1,
                    joined: 1,
                    lastSeen: 1,
                    userpic: 1,
                    accountType: 1,
                },
            },
        ]);

        return res.status(200).json({ friendDataList });
    } catch (err) {
        return next(err);
    }
};

export { getFriendData };

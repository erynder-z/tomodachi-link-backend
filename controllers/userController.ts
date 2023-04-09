import { Request, Response, NextFunction } from 'express';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';

const getSomeUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const reqUser = req.user as JwtUser;

    try {
        const currentUser = await User.findById(reqUser._id);
        if (!currentUser) {
            return res
                .status(404)
                .json({ errors: [{ message: 'User not found' }] });
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

export { getSomeUsers };

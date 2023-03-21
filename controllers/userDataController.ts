import { NextFunction, Request, Response } from 'express';
import User, { UserModelType } from '../models/user';

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    if (req.user) {
        const user = req.user as UserModelType;
        const id = user._id;

        try {
            const user = await User.findOne({ _id: id }, { password: 0 });
            if (!user) {
                return res
                    .status(404)
                    .json({ error: { message: 'User not found' } });
            }
            return res.json({ user });
        } catch (err) {
            return next(err);
        }
    }
};

export { getUserData };

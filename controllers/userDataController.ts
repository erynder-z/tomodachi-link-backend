import { NextFunction, Request, Response } from 'express';
import User from '../models/user';

const getUserData = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

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
};

export { getUserData };

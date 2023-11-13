import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';

const isReadOperationForbidden = async (
    currentUser: UserModelType | null,
    postOwnerId: mongoose.Types.ObjectId
): Promise<boolean> => {
    if (!currentUser) {
        return true;
    }
    if (
        currentUser._id.toString() !== postOwnerId.toString() &&
        !currentUser.friends.includes(postOwnerId)
    ) {
        return true;
    }
    return false;
};

const countPostsContainingImage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id;
        const count = await Post.countDocuments({
            owner: new mongoose.Types.ObjectId(id),
            image: { $exists: true },
        });
        res.status(200).json({ count });
    } catch (err) {
        return next(err);
    }
};

const getPictureList = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;

    try {
        const id = req.params.id;
        const ITEMS_PER_PAGE = 9;
        const ownerId = new mongoose.Types.ObjectId(id);

        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);

        if (await isReadOperationForbidden(currentUser, ownerId)) {
            const ERROR_MESSAGE = 'Forbidden';
            return res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const userPosts = await Post.find({
            owner: ownerId,
            image: { $exists: true },
        })
            .select('image')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(ITEMS_PER_PAGE)
            .lean()
            .exec();

        const images = userPosts.map((post) => post.image);
        res.status(200).json({ images });
    } catch (err) {
        return next(err);
    }
};

export { countPostsContainingImage, getPictureList };

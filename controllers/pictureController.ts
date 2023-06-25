import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post';
import User, { UserModelType } from '../models/user';
import { JwtUser } from '../types/jwtUser';

const isReadOperationForbidden = async (
    currentUser: UserModelType | null,
    postOwnerId: mongoose.Types.ObjectId
): Promise<boolean> => {
    if (
        !currentUser ||
        (currentUser._id.toString() !== postOwnerId.toString() &&
            !currentUser.friends.includes(postOwnerId))
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
        const ownerId = new mongoose.Types.ObjectId(id);
        const count = await Post.countDocuments({
            owner: ownerId,
            image: { $exists: true },
        }).exec();
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
        const itemsPerPage = 9;
        const ownerId = new mongoose.Types.ObjectId(id);

        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);

        if (await isReadOperationForbidden(currentUser, ownerId)) {
            return res.status(403).json({
                errors: [{ msg: 'Forbidden' }],
            });
        }

        const userPosts = await Post.find({
            owner: ownerId,
            image: { $exists: true },
        })
            .select('image')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(itemsPerPage)
            .exec();

        const images = userPosts.map((post) => post.image);
        res.status(200).json({ images });
    } catch (err) {
        return next(err);
    }
};

export { countPostsContainingImage, getPictureList };

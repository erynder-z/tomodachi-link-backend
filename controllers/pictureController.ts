import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post';

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
    try {
        const id = req.params.id;
        const page = req.query.page
            ? parseInt(req.query.page as string, 10)
            : 1;
        const itemsPerPage = 9;
        const ownerId = new mongoose.Types.ObjectId(id);
        const skip = (page - 1) * itemsPerPage;

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

import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/post';

const getRecentPictures = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id;
        const ownerId = new mongoose.Types.ObjectId(id);
        const userPosts = await Post.find({
            owner: ownerId,
            image: { $exists: true },
        })
            .select('image')
            .sort({ timestamp: -1 })
            .limit(9)
            .exec();
        const images = userPosts.map((post) => post.image);
        res.status(200).json({ images });
    } catch (err) {
        return next(err);
    }
};

export { getRecentPictures };

import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';

const getUserPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;

    try {
        const reqUser = req.user as JwtUser;
        const userPosts = await Post.find({ owner: reqUser })
            .populate('owner', 'username userpic')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(10)
            .exec();
        res.status(200).json({ userPosts });
    } catch (err) {
        return next(err);
    }
};

const addNewPost = [
    body('newPost', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        const post = new Post({
            owner: req.user,
            timestamp: Date.now(),
            text: req.body.newPost,
            // TODO: Image
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        try {
            const savedPost = await post.save();
            const reqUser = req.user as JwtUser;

            await User.updateOne(
                { _id: reqUser._id },
                { $push: { posts: savedPost._id } }
            );
            res.status(200).json({
                title: 'Post created successfully!',
                savedPost,
            });
        } catch (err) {
            return next(err);
        }
    },
];

export { getUserPosts, addNewPost };

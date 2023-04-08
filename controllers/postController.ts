import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Post, { PostType } from '../models/post';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';
/* 
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
}; */

const getUserPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;

    try {
        const reqUser = req.user as JwtUser;
        const userPosts = await Post.find({ owner: reqUser })
            .select('_id')
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(10)
            .exec();
        res.status(200).json({ userPosts });
    } catch (err) {
        return next(err);
    }
};

const getPostDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const id = req.params.id;
        const retrievedPost = await Post.findById(id)
            .populate('owner', 'username userpic')
            .populate({
                path: 'comments',
                populate: { path: 'owner', select: 'username userpic' },
            })
            .exec();
        res.status(200).json({ retrievedPost });
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

const positiveReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtUser;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                title: 'Post not found!',
            });
        }

        const reactedUsers = post.reactions.reacted_users;
        const isAlreadyReacted = reactedUsers.some(
            (userId) => userId.toString() === reqUser._id.toString()
        );
        if (isAlreadyReacted) {
            return res.status(400).json({
                errors: [{ msg: 'User already reacted to this post!' }],
            });
        }

        const updatedPost = await Post.updateOne(
            {
                _id: postId,
                $or: [
                    { 'reactions.reacted_users': [] },
                    {
                        'reactions.reacted_users': {
                            $not: { $in: [reqUser._id] },
                        },
                    },
                ],
            },
            {
                $inc: { 'reactions.positive': 1 },
                $addToSet: { 'reactions.reacted_users': reqUser._id },
            }
        );

        res.status(200).json({
            title: 'Reacted successfully!',
            updatedPost,
        });
    } catch (err) {
        return next(err);
    }
};

const negativeReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtUser;
        const postId = req.params.id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                title: 'Post not found!',
            });
        }

        const reactedUsers = post.reactions.reacted_users;
        const isAlreadyReacted = reactedUsers.some(
            (userId) => userId.toString() === reqUser._id.toString()
        );
        if (isAlreadyReacted) {
            return res.status(400).json({
                errors: [{ msg: 'User already reacted to this post!' }],
            });
        }

        const updatedPost = await Post.updateOne(
            {
                _id: postId,
                $or: [
                    { 'reactions.reacted_users': [] },
                    {
                        'reactions.reacted_users': {
                            $not: { $in: [reqUser._id] },
                        },
                    },
                ],
            },
            {
                $inc: { 'reactions.negative': 1 },
                $addToSet: { 'reactions.reacted_users': reqUser._id },
            }
        );

        res.status(200).json({
            title: 'Reacted successfully!',
            updatedPost,
        });
    } catch (err) {
        return next(err);
    }
};

export {
    getUserPosts,
    getPostDetails,
    addNewPost,
    positiveReaction,
    negativeReaction,
};

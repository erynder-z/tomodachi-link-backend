import { NextFunction, Request, Response } from 'express';
import { body, check, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { validateGifUrl } from './validators/urlVallidator/validateGifUrl';

const getOwnPosts = async (req: Request, res: Response, next: NextFunction) => {
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

const getOtherPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;

    try {
        const id = req.params.id;
        const ownerId = new mongoose.Types.ObjectId(id);
        const userPosts = await Post.find({ owner: ownerId })
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
            .populate('owner', 'firstName lastName userpic')
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })
            .exec();
        res.status(200).json({ retrievedPost });
    } catch (err) {
        return next(err);
    }
};

const createPost = async (
    owner: JwtUser,
    text: string,
    image:
        | {
              data: any;
              contentType: any;
          }
        | undefined,
    embeddedVideoID: string,
    gifUrl: string
) => {
    const post = new Post({
        owner,
        timestamp: Date.now(),
        text,
        image,
        embeddedVideoID,
        gifUrl,
    });
    return await post.save();
};

const savePostToUser = async (user: JwtUser, postId: string) => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $push: { posts: postId } }
    );
};

const addNewPost = [
    body('newPost', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
    body('embeddedVideoID', 'Video ID must be a string')
        .trim()
        .optional()
        .escape(),
    check('image').custom((value, { req }) => {
        if (req.file && !req.file.mimetype.startsWith('image/')) {
            return Promise.reject('Invalid file type!');
        }
        return true;
    }),
    validateGifUrl(),

    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                });
            }

            const reqUser = req.user as JwtUser;
            const { newPost, embeddedVideoID, gifUrl } = req.body;
            const image = req.file
                ? { data: req.file.buffer, contentType: req.file.mimetype }
                : undefined;

            const savedPost = await createPost(
                reqUser,
                newPost,
                image,
                embeddedVideoID,
                gifUrl
            );
            await savePostToUser(reqUser, savedPost._id);

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

        const updatedPost = await Post.findOneAndUpdate(
            {
                _id: postId,
                'reactions.reacted_users': { $ne: reqUser._id },
            },
            {
                $inc: { 'reactions.positive': 1 },
                $push: { 'reactions.reacted_users': reqUser._id },
            },
            { new: true, lean: true }
        );

        if (!updatedPost) {
            return res.status(409).json({
                errors: [{ msg: 'User already reacted to this post!' }],
            });
        }

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

        const updatedPost = await Post.findOneAndUpdate(
            {
                _id: postId,
                'reactions.reacted_users': { $ne: reqUser._id },
            },
            {
                $inc: { 'reactions.negative': 1 },
                $push: { 'reactions.reacted_users': reqUser._id },
            },
            { new: true, lean: true }
        );

        if (!updatedPost) {
            return res.status(409).json({
                errors: [{ msg: 'User already reacted to this post!' }],
            });
        }

        res.status(200).json({
            title: 'Reacted successfully!',
            updatedPost,
        });
    } catch (err) {
        return next(err);
    }
};

export {
    getOwnPosts,
    getOtherPosts,
    getPostDetails,
    addNewPost,
    positiveReaction,
    negativeReaction,
};

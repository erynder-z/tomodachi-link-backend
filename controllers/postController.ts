import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';
import mongoose from 'mongoose';
import { validateGifUrl } from './validators/postValidators/validateGifUrl';
import { validateText } from './validators/postValidators/validateText';
import { validateEmbeddedVideoID } from './validators/postValidators/validateEmbeddedVideoID';
import { validateImage } from './validators/imageValidators/validateImage';
import { validateFriendshipStatus } from '../middleware/validateFriendshipStatus';
import { randomUUID } from 'crypto';

const getPosts = async (req: Request, res: Response, next: NextFunction) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const BATCH_SIZE = 10;
    try {
        const id = req.params.id;
        const ownerId = new mongoose.Types.ObjectId(id);

        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);

        if (await validateFriendshipStatus(currentUser, ownerId)) {
            const ERROR_MESSAGE = 'Forbidden';
            return res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const userPosts = await Post.find({ owner: ownerId })
            .select('_id')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(BATCH_SIZE)
            .exec();

        res.status(200).json({ userPosts });
    } catch (err) {
        next(err);
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

        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);
        const postOwner = retrievedPost?.owner;
        const postOwnerId = new mongoose.Types.ObjectId(postOwner?._id);

        if (await validateFriendshipStatus(currentUser, postOwnerId)) {
            const ERROR_MESSAGE = 'Forbidden';
            return res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        res.status(200).json({ retrievedPost, postOwner });
    } catch (err) {
        return next(err);
    }
};

const createPost = async (
    owner: string,
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

const savePostInDatabase = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
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
            ? {
                  id: randomUUID(),
                  data: req.file.buffer,
                  contentType: req.file.mimetype,
              }
            : undefined;

        const savedPost = await createPost(
            reqUser._id,
            newPost,
            image,
            embeddedVideoID,
            gifUrl
        );
        await savePostToUser(reqUser, savedPost._id);

        res.status(200).json({
            savedPost,
        });
    } catch (err) {
        return next(err);
    }
};
const addNewPost = [
    validateText(),
    validateEmbeddedVideoID(),
    validateGifUrl(),
    validateImage(),
    savePostInDatabase,
];

const deletePostFromUser = async (user: JwtUser, postId: string) => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $pull: { posts: postId } }
    );
};

const deletePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const reqUser = req.user as JwtUser;
        const postID = req.params.id;

        const post = await Post.findById(postID).populate('owner');

        if (!post) {
            const ERROR_MESSAGE = 'Post not found';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const postOwner = post.owner;

        if (postOwner._id.toString() !== reqUser._id.toString()) {
            const ERROR_MESSAGE = 'Forbidden';
            return res.status(403).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        await Post.findByIdAndRemove(postID);
        await deletePostFromUser(reqUser, postID);

        res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};

const updatePost = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        const reqUser = req.user as JwtUser;
        const postID = req.params.id;
        const {
            newPost,
            embeddedVideoID,
            gifUrl,
            shouldImageBeDeleted,
            shouldGifBeDeleted,
            shouldVideoBeDeleted,
        } = req.body;

        const image = req.file
            ? {
                  id: randomUUID(),
                  data: req.file.buffer,
                  contentType: req.file.mimetype,
              }
            : undefined;

        const updateData: any = {
            text: newPost,
        };

        if (JSON.parse(shouldImageBeDeleted)) {
            updateData.$unset = { image: '' };
        } else {
            updateData.image = image;
        }

        if (JSON.parse(shouldGifBeDeleted)) {
            updateData.gifUrl = undefined;
        } else {
            updateData.gifUrl = gifUrl;
        }

        if (JSON.parse(shouldVideoBeDeleted)) {
            updateData.embeddedVideoID = undefined;
        } else {
            updateData.embeddedVideoID = embeddedVideoID;
        }

        try {
            const updatedPost = await Post.findByIdAndUpdate(
                postID,
                updateData,
                { new: true }
            ).populate('owner');

            if (!updatedPost) {
                const ERROR_MESSAGE = 'Post not found!';
                return res.status(404).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            const postOwner = updatedPost.owner;

            // Check if the requesting user is the post owner
            if (postOwner._id.toString() !== reqUser._id.toString()) {
                const ERROR_MESSAGE = 'Forbidden';
                return res.status(403).json({
                    errors: [{ msg: ERROR_MESSAGE }],
                });
            }

            res.status(200).json({
                updatedPost,
            });
        } catch (err) {
            return next(err);
        }
    } catch (err) {
        return next(err);
    }
};

const editPost = [
    validateText(),
    validateEmbeddedVideoID(),
    validateGifUrl(),
    validateImage(),
    updatePost,
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
            const ERROR_MESSAGE = 'User already reacted to this post!';
            return res.status(409).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        res.status(200).json({
            updatedPost,
        });
    } catch (err) {
        return next(err);
    }
};

export {
    getPosts,
    getPostDetails,
    addNewPost,
    deletePost,
    editPost,
    positiveReaction,
    negativeReaction,
};

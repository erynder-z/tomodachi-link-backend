import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Post from '../models/post.js';
import User from '../models/user.js';
import { JwtUser } from '../types/jwtUser.js';
import mongoose from 'mongoose';
import { validateGifUrl } from './validators/postValidators/validateGifUrl.js';
import { validateText } from './validators/postValidators/validateText.js';
import { validateEmbeddedVideoID } from './validators/postValidators/validateEmbeddedVideoID.js';
import { validateImage } from './validators/imageValidators/validateImage.js';
import { validateFriendshipStatus } from '../middleware/validateFriendshipStatus.js';
import { randomUUID } from 'crypto';

/**
 * Retrieves user posts based on the request parameters.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void |Response<any, Record<string, any>>>} a promise that resolves with the retrieved user posts
 */
const getPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const skip = parseInt(req.query.skip as string, 10) || 0;
        const BATCH_SIZE = 10;

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
            .lean()
            .exec();

        res.status(200).json({ userPosts });
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves post details and handles user authentication.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves to nothing
 */
const getPostDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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
            .lean()
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

/**
 * Creates a new post with the given owner, text, image, embedded video ID, and GIF URL.
 *
 * @param {string} owner - The owner of the post
 * @param {string} text - The text content of the post
 * @param {{ data: any; contentType: any; } | undefined} image - The image data and content type, or undefined if no image is included
 * @param {string} embeddedVideoID - The ID of the embedded video
 * @param {string} gifUrl - The URL of the GIF
 * @return {Promise<any>} a promise that resolves with the saved post
 */
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
): Promise<any> => {
    const post = new Post({
        owner,
        text,
        image,
        embeddedVideoID,
        gifUrl,
    });
    return await post.save();
};

/**
 * Saves the specified post to the user's list of posts.
 *
 * @param {JwtUser} user - The user object
 * @param {string} postId - The ID of the post to be saved
 * @return {Promise<any>} A promise that resolves to the result of the update operation
 */
const savePostToUser = async (user: JwtUser, postId: string): Promise<any> => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $push: { posts: postId } }
    );
};

/**
 * Saves a post in the database and associates it with the current user.
 *
 * @param {Request} req - the HTTP request object
 * @param {Response} res - the HTTP response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} no return value
 */
const savePostInDatabase = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const reqUser = req.user as JwtUser;
        const { newPost, embeddedVideoID, gifUrl } = req.body;
        const image = req.file && {
            id: randomUUID(),
            data: req.file.buffer,
            contentType: req.file.mimetype,
        };

        const savedPost = await createPost(
            reqUser._id,
            newPost,
            image,
            embeddedVideoID,
            gifUrl
        );
        await savePostToUser(reqUser, savedPost._id);

        res.status(200).json({ savedPost });
    } catch (err) {
        next(err);
    }
};

/**
 * Deletes a post from the user's list of posts.
 *
 * @param {JwtUser} user - the user object
 * @param {string} postId - the ID of the post to be deleted
 * @return {Promise<any>} a promise that resolves to the update result
 */
const deletePostFromUser = async (
    user: JwtUser,
    postId: string
): Promise<any> => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $pull: { posts: postId } }
    );
};

/**
 * Deletes a post if the requesting user is the owner.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void |Response<any, Record<string, any>>>} a promise that resolves to void
 */
const deletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

        await Post.findByIdAndDelete(postID);
        await deletePostFromUser(reqUser, postID);

        res.status(200).json({});
    } catch (error) {
        return next(error);
    }
};

/**
 * Asynchronously updates a post based on the request data.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void |Response<any, Record<string, any>>>} A promise that resolves after updating the post
 */
const updatePost = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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
        image: JSON.parse(shouldImageBeDeleted) ? undefined : image,
        gifUrl: JSON.parse(shouldGifBeDeleted) ? undefined : gifUrl,
        embeddedVideoID: JSON.parse(shouldVideoBeDeleted)
            ? undefined
            : embeddedVideoID,
    };

    try {
        const updatedPost = await Post.findByIdAndUpdate(postID, updateData, {
            new: true,
        }).populate('owner');

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
};

/**
 * Updates the positive reactions of a post and the list of users who reacted, then returns the updated post.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves to the updated post
 */
const positiveReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const reqUser = req.user as JwtUser;
        const postId = req.params.id;

        const filter = {
            _id: postId,
            'reactions.reacted_users': { $ne: reqUser._id },
        };

        const update = {
            $inc: { 'reactions.positive': 1 },
            $push: { 'reactions.reacted_users': reqUser._id },
        };

        const options = {
            new: true,
            lean: true,
        };

        const updatedPost = await Post.findOneAndUpdate(
            filter,
            update,
            options
        );

        if (!updatedPost) {
            return res.status(409).json({
                errors: [{ msg: 'User already reacted to this post!' }],
            });
        }

        res.status(200).json({ updatedPost });
    } catch (err) {
        return next(err);
    }
};

/**
 * Handles a negative reaction to a post.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves to nothing
 */
const negativeReaction = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const reqUser = req.user as JwtUser;
        const postId = req.params.id;

        const filter = {
            _id: postId,
            'reactions.reacted_users': { $ne: reqUser._id },
        };

        const update = {
            $inc: { 'reactions.negative': 1 },
            $push: { 'reactions.reacted_users': reqUser._id },
        };

        const options = {
            new: true,
            lean: true,
        };

        const updatedPost = await Post.findOneAndUpdate(
            filter,
            update,
            options
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

const addNewPost = [
    validateText(),
    validateEmbeddedVideoID(),
    validateGifUrl(),
    validateImage(),
    savePostInDatabase,
];

const editPost = [
    validateText(),
    validateEmbeddedVideoID(),
    validateGifUrl(),
    validateImage(),
    updatePost,
];

export {
    getPosts,
    getPostDetails,
    addNewPost,
    deletePost,
    editPost,
    positiveReaction,
    negativeReaction,
};

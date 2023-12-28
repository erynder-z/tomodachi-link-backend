import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { LoginErrorMessage } from '../types/loginErrorMessage';
import type { AdminModelType } from '../models/admin';
import jwt from 'jsonwebtoken';
import Post from '../models/post';
import User from '../models/user';
import { Types } from 'mongoose';
import Admin from '../models/admin';
import { JwtAdmin } from '../types/jwtAdmin';
import Poll from '../models/poll';

const generateToken = (admin: AdminModelType) => {
    const TOKEN_SECRET_KEY = process.env.ADMIN_TOKEN_SECRET_KEY;
    const TOKEN_EXPIRE_TIME = process.env.ADMIN_TOKEN_EXPIRE_TIME;

    const { _id, username } = admin;
    return jwt.sign(
        {
            user: {
                _id,
                username,
            },
        },
        `${TOKEN_SECRET_KEY}`,
        { expiresIn: TOKEN_EXPIRE_TIME }
    );
};

const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    const AUTH_ERROR_MESSAGE = 'Error while logging in';

    passport.authenticate(
        'adminLogin',
        async (
            err: Error,
            admin: AdminModelType,
            authResultInfo: LoginErrorMessage
        ) => {
            if (err || !admin) {
                return res
                    .status(400)
                    .json({ error: { message: authResultInfo.message } });
            }
            try {
                req.login(admin, { session: false }, async (error) => {
                    if (error)
                        return res.status(400).json({
                            error: { message: AUTH_ERROR_MESSAGE },
                        });
                    const token = generateToken(admin);
                    return res.status(200).json({ success: true, token });
                });
            } catch (error) {
                return res
                    .status(400)
                    .json({ error: { message: AUTH_ERROR_MESSAGE } });
            }
        }
    )(req, res, next);
};

const adminGetPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        }

        const posts = await Post.find()
            .populate('owner', 'firstName lastName userpic')
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        res.status(200).json({ posts });
    } catch (err) {
        next(err);
    }
};

const deletePostFromUser = async (userID: Types.ObjectId, postId: string) => {
    return await User.updateOne({ _id: userID }, { $pull: { posts: postId } });
};

const adminDeletePost = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        }
        const postID = req.params.id;

        const post = await Post.findById(postID).populate('owner');

        if (!post) {
            const ERROR_MESSAGE = 'Post not found';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const postOwnerID = post.owner._id;

        await Post.findByIdAndRemove(postID);
        await deletePostFromUser(postOwnerID, postID);

        res.status(200).json({});
    } catch (err) {
        next(err);
    }
};

const adminGetUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        }

        const users = await User.find()

            .sort({ createdAt: -1 })
            .lean()
            .exec();

        res.status(200).json({ users });
    } catch (err) {
        next(err);
    }
};

const adminGetPolls = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        }

        const polls = await Poll.find()
            .populate('owner', 'firstName lastName userpic')
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })
            .sort({ createdAt: -1 })
            .lean()
            .exec();

        res.status(200).json({ polls });
    } catch (err) {
        next(err);
    }
};

const deletePollFromUser = async (userID: Types.ObjectId, pollId: string) => {
    return await Poll.updateOne({ _id: userID }, { $pull: { polls: pollId } });
};

const adminDeletePoll = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            return res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        }
        const pollID = req.params.id;

        const poll = await Poll.findById(pollID).populate('owner');

        if (!poll) {
            const ERROR_MESSAGE = 'Post not found';
            return res.status(404).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        const pollOwnerID = poll.owner._id;

        await Poll.findByIdAndRemove(pollID);
        await deletePollFromUser(pollOwnerID, pollID);

        res.status(200).json({});
    } catch (err) {
        next(err);
    }
};

export {
    adminLogin,
    adminGetPosts,
    adminDeletePost,
    adminGetUsers,
    adminGetPolls,
    adminDeletePoll,
};

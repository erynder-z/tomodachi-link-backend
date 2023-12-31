import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { LoginErrorMessage } from '../types/loginErrorMessage';
import type { AdminModelType } from '../models/admin';
import jwt from 'jsonwebtoken';
import Post, { PostModelType } from '../models/post';
import User from '../models/user';
import { FlattenMaps, Types } from 'mongoose';
import Admin from '../models/admin';
import { JwtAdmin } from '../types/jwtAdmin';
import Poll from '../models/poll';
import { AllSearchResultsType } from '../types/searchTypes';

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

const filterNonEmptyTerms = (terms: string[]): string[] =>
    terms.filter((term) => term.trim() !== '');

// Function to perform the user search
const searchUsers = async (
    terms: string[],
    allResults: AllSearchResultsType[]
) => {
    const filteredTerms = filterNonEmptyTerms(terms);
    if (filteredTerms.length === 0) {
        return;
    }

    const userRegexQueries = terms.map((term) => ({
        $or: [
            { firstName: { $regex: `\\b${term}`, $options: 'i' } },
            { lastName: { $regex: `\\b${term}`, $options: 'i' } },
        ],
    }));

    const userResults = await User.find({ $or: userRegexQueries }).lean();

    const mappedUserResults: AllSearchResultsType[] = userResults.map(
        (result: {
            _id: string;
            firstName: string;
            lastName: string;
            userpic: FlattenMaps<{ data: Buffer; contentType: string }>;
        }) => ({
            type: 'user',
            data: result,
        })
    );

    allResults.push(...mappedUserResults);
};

// Function to perform the post search
const searchPosts = async (
    terms: string[],
    allResults: AllSearchResultsType[]
) => {
    const filteredTerms = filterNonEmptyTerms(terms);
    if (filteredTerms.length === 0) {
        return;
    }

    const postRegexQueries = terms.map((term) => ({
        $or: [{ text: { $regex: `\\b${term}`, $options: 'i' } }],
    }));

    const postResults = await Post.find({ $or: postRegexQueries })
        .populate('owner', 'firstName lastName userpic')
        .populate({
            path: 'comments',
            populate: {
                path: 'owner',
                select: 'firstName lastName userpic',
            },
        })
        .lean();

    const mappedPostResults: AllSearchResultsType[] = postResults.map(
        (result: PostModelType) => ({
            type: 'post',
            data: result,
        })
    );

    allResults.push(...mappedPostResults);
};

// Function to perform the poll search
const searchPolls = async (
    terms: string[],
    allResults: AllSearchResultsType[]
) => {
    const filteredTerms = filterNonEmptyTerms(terms);
    if (filteredTerms.length === 0) {
        return;
    }

    const pollRegexQueries = terms.map((term) => ({
        $or: [
            { question: { $regex: `\\b${term}`, $options: 'i' } },
            { description: { $regex: `\\b${term}`, $options: 'i' } },
        ],
    }));

    const pollResults = await Poll.find({ $or: pollRegexQueries })
        .populate('owner', 'firstName lastName userpic')
        .populate({
            path: 'comments',
            populate: {
                path: 'owner',
                select: 'firstName lastName userpic',
            },
        })
        .sort({ createdAt: -1 })
        .lean();

    const mappedPollResults: AllSearchResultsType[] = pollResults.map(
        (result: {
            _id: string;
            question: string;
            description: string;
            updatedAt: Date;
        }) => ({
            type: 'poll',
            data: result,
        })
    );

    allResults.push(...mappedPollResults);
};

// Function to perform the query search
const adminPerformSearch = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
            return;
        }

        const query = req.query.query as string;

        if (!query) {
            const ERROR_MESSAGE = 'Query parameter is required!';
            res.status(400).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
            return;
        }

        const terms = query.trim().split(' ');
        const allResults: AllSearchResultsType[] = [];

        await searchUsers(terms, allResults);

        await searchPosts(terms, allResults);

        await searchPolls(terms, allResults);

        res.json(allResults);
    } catch (error) {
        const ERROR_MESSAGE = 'Something went wrong while searching!';
        console.error('Error searching:', error);
        res.status(500).json({
            errors: [{ msg: ERROR_MESSAGE }],
        });
    }
};

const getNumberOfUsers = async () => {
    return await User.countDocuments();
};

const getNumberOfPosts = async () => {
    return await Post.countDocuments();
};

const getNumberOfPolls = async () => {
    return await Poll.countDocuments();
};

const getProviderOdinUsers = async () => {
    return await User.countDocuments({ 'provider.name': 'odin' });
};

const getProviderGoogleUsers = async () => {
    return await User.countDocuments({ 'provider.name': 'google' });
};

const getProviderDiscordUsers = async () => {
    return await User.countDocuments({ 'provider.name': 'discord' });
};

const adminGetDashboardData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const reqUser = req.user as JwtAdmin;
        const isAdmin = await Admin.exists({ _id: reqUser });

        if (!isAdmin) {
            res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
            return;
        }

        const numberOfUsers = await getNumberOfUsers();
        const numberOfPosts = await getNumberOfPosts();
        const numberOfPolls = await getNumberOfPolls();
        const providerOdinUsers = await getProviderOdinUsers();
        const providerGoogleUsers = await getProviderGoogleUsers();
        const providerDiscordUsers = await getProviderDiscordUsers();

        const dashboardData = {
            totalUsers: numberOfUsers,
            totalPosts: numberOfPosts,
            totalPolls: numberOfPolls,
            providerOdinUsers: providerOdinUsers,
            providerGoogleUsers: providerGoogleUsers,
            providerDiscordUsers: providerDiscordUsers,
        };

        res.status(200).json({ dashboardData });
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
    adminPerformSearch,
    adminGetDashboardData,
};

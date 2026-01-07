import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { LoginErrorMessage } from '../types/loginErrorMessage';
import type { AdminModelType } from '../models/admin';
import jwt from 'jsonwebtoken';
import Post, { PostModelType } from '../models/post';
import User, { UserType } from '../models/user';
import { Types } from 'mongoose';
import Admin from '../models/admin';
import { JwtAdmin } from '../types/jwtAdmin';
import Poll, { PollType } from '../models/poll';
import { AllSearchResultsType } from '../types/searchTypes';

/**
 * Generates a JWT token for the provided admin.
 * @param {AdminModelType} admin The admin object for which the token is generated.
 * @returns {string} The generated JWT token.
 */
const generateToken = (admin: AdminModelType): string => {
    const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;
    const TOKEN_EXPIRE_TIME = process.env.TOKEN_EXPIRE_TIME;

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

/**
 * Handles the login request for admin users.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 * @return {Promise<void>} A promise that resolves to the result of the login operation
 */
const adminLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

/**
 * Retrieves all posts from the database.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>>}
 */
const adminGetPosts = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Deletes a post from the user's list of posts.
 *
 * @param {Types.ObjectId} userID - The ID of the user
 * @param {string} postId - The ID of the post to be deleted
 * @return {Promise<any>} A promise that resolves to the result of the update operation
 */
const deletePostFromUser = async (
    userID: Types.ObjectId,
    postId: string
): Promise<any> => {
    return await User.updateOne({ _id: userID }, { $pull: { posts: postId } });
};

/**
 * Deletes a post from the database.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 */
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

        await Post.findByIdAndDelete(postID);
        await deletePostFromUser(postOwnerID, postID);

        res.status(200).json({});
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves all users from the database.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 */
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

/**
 * Retrieves all polls from the database.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 */
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

/**
 * Deletes a poll from a user's list of polls.
 *
 * @param {Types.ObjectId} userID - the ID of the user
 * @param {string} pollId - the ID of the poll to be deleted
 * @return {Promise<any>} a promise that resolves to the result of the update operation
 */
const deletePollFromUser = async (
    userID: Types.ObjectId,
    pollId: string
): Promise<any> => {
    return await Poll.updateOne({ _id: userID }, { $pull: { polls: pollId } });
};

/**
 * Deletes a poll from the database.
 * @param {Request} req The request object.
 * @param {Response} res The response object.
 * @param {NextFunction} next The next function in the middleware chain.
 */
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

        await Poll.findByIdAndDelete(pollID);
        await deletePollFromUser(pollOwnerID, pollID);

        res.status(200).json({});
    } catch (err) {
        next(err);
    }
};

/**
 * Filters out non-empty terms from the input array.
 *
 * @param {string[]} terms - the array of terms to filter
 * @return {string[]} the filtered array of non-empty terms
 */
const filterNonEmptyTerms = (terms: string[]): string[] =>
    terms.filter((term) => term.trim() !== '');

/**
 * Asynchronously searches users based on the provided terms and adds the results to the given array of all search results.
 *
 * @param {string[]} terms - an array of search terms
 * @param {AllSearchResultsType[]} allResults - an array of all search results
 * @return {Promise<void>} A promise that resolves to the result of the search operation
 */
const searchUsers = async (
    terms: string[],
    allResults: AllSearchResultsType[]
): Promise<void> => {
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
        (result: UserType) => ({
            type: 'user',
            data: {
                _id: result._id as Types.ObjectId,
                firstName: result.firstName,
                lastName: result.lastName,
                userpic: result.userpic,
            },
        })
    );

    allResults.push(...mappedUserResults);
};

/**
 * Asynchronously search for posts based on the provided terms and update the allResults array with the matched post results.
 *
 * @param {string[]} terms - the search terms to filter the posts
 * @param {AllSearchResultsType[]} allResults - the array to store the matched post results
 * @return {Promise<void>} A promise that resolves to the result of the search operation
 */
const searchPosts = async (
    terms: string[],
    allResults: AllSearchResultsType[]
): Promise<void> => {
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
            data: {
                _id: result._id.toString(),
                text: result.text,
                updatedAt: result.updatedAt,
                owner: result.owner,
            },
        })
    );

    allResults.push(...mappedPostResults);
};

/**
 * Asynchronously search for polls based on the provided terms and add the results to the specified array.
 *
 * @param {string[]} terms - the search terms to filter polls by
 * @param {AllSearchResultsType[]} allResults - the array to add the search results to
 * @return {Promise<void>} A promise that resolves to the result of the search operation
 */
const searchPolls = async (
    terms: string[],
    allResults: AllSearchResultsType[]
): Promise<void> => {
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
        (result: PollType & { _id: Types.ObjectId }) => ({
            type: 'poll',
            data: {
                _id: result._id.toString(),
                question: result.question,
                description: result.description,
                updatedAt: result.updatedAt,
            },
        })
    );

    allResults.push(...mappedPollResults);
};

/**
 * Perform a search as an admin user.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @return {Promise<void>} a promise that resolves to the result of the search
 */
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

/**
 * Retrieves the number of users from the database.
 *
 * @return {Promise<number>} The number of users.
 */
const getNumberOfUsers = async (): Promise<number> => {
    return await User.countDocuments();
};

/**
 * Retrieves the number of posts from the database.
 *
 * @return {Promise<number>} The number of posts.
 */
const getNumberOfPosts = async (): Promise<number> => {
    return await Post.countDocuments();
};

/**
 * Retrieves the number of polls.
 *
 * @return {Promise<number>} The number of polls.
 */
const getNumberOfPolls = async (): Promise<number> => {
    return await Poll.countDocuments();
};

/**
 * Retrieves the count of users with the provider name 'tomodachi'.
 *
 * @return {Promise<number>} The count of users with the provider name 'tomodachi'
 */
const getProviderTomodachiUsers = async (): Promise<number> => {
    return await User.countDocuments({ 'provider.name': 'tomodachi' });
};

/**
 * Retrieves the count of User documents with 'provider.name' equal to 'google'.
 *
 * @return {Promise<number>} The count of User documents.
 */
const getProviderGoogleUsers = async (): Promise<number> => {
    return await User.countDocuments({ 'provider.name': 'google' });
};

/**
 * Retrieves the count of users with 'discord' as the provider name.
 *
 * @return {Promise<number>} The count of users with 'discord' as the provider name
 */
const getProviderDiscordUsers = async (): Promise<number> => {
    return await User.countDocuments({ 'provider.name': 'discord' });
};

/**
 * Retrieves the latest logon date from the User collection.
 *
 * @return {Promise<Date>} The latest logon date
 */
const getLatestLoginDate = async (): Promise<Date> => {
    try {
        const latestLogin = await User.findOne().sort({ lastSeen: -1 }).exec();
        if (latestLogin) {
            return latestLogin.lastSeen;
        } else {
            return new Date(0); // Return a default date if no posts exist
        }
    } catch (error) {
        console.error('Error fetching latest activity:', error);
        throw error;
    }
};

/**
 * Retrieves dashboard data for the admin user, including user and post statistics.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void>} a promise that resolves when the dashboard data is successfully retrieved
 */
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
        const providerTomodachiUsers = await getProviderTomodachiUsers();
        const providerGoogleUsers = await getProviderGoogleUsers();
        const providerDiscordUsers = await getProviderDiscordUsers();
        const latestLoginDate = await getLatestLoginDate();

        const dashboardData = {
            totalUsers: numberOfUsers,
            totalPosts: numberOfPosts,
            totalPolls: numberOfPolls,
            providerTomodachiUsers: providerTomodachiUsers,
            providerGoogleUsers: providerGoogleUsers,
            providerDiscordUsers: providerDiscordUsers,
            latestLoginDate: latestLoginDate,
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

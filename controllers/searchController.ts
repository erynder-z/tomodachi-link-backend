import { Request, Response } from 'express';
import User, { UserModelType, UserType } from '../models/user.js';
import Post, { PostModelType } from '../models/post.js';
import Poll, { PollType } from '../models/poll.js';
import { AllSearchResultsType } from '../types/searchTypes.js';
import { JwtUser } from '../types/jwtUser.js';
import mongoose, { Types } from 'mongoose';

/**
 * Filters out the non-empty terms from the input array of strings.
 *
 * @param {string[]} terms - The array of strings to filter
 * @return {string[]} The array of non-empty strings
 */
const filterNonEmptyTerms = (terms: string[]): string[] =>
    terms.filter((term) => term.trim() !== '');

/**
 * Search for users based on given terms and add the results to the allResults array.
 *
 * @param {string[]} terms - The search terms to filter users by
 * @param {AllSearchResultsType[]} allResults - The array to add the search results to
 * @return {Promise<void>} - A promise that resolves to the result of the search
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

    const userResults = await User.find({ $or: userRegexQueries })
        .select(['firstName', 'lastName', 'userpic'])
        .lean();

    const mappedUserResults: AllSearchResultsType[] = userResults.map(
        (result: UserType) => ({
            type: 'user',
            data: {
                _id: new mongoose.Types.ObjectId(result._id.toString()),
                firstName: result.firstName,
                lastName: result.lastName,
                userpic: result.userpic,
            },
        })
    );

    allResults.push(...mappedUserResults);
};

/**
 * Search for posts based on given terms and add the results to the allResults array.
 *
 * @param {string[]} terms - Array of search terms
 * @param {UserModelType | null} currentUser - Current user or null if not authenticated
 * @param {AllSearchResultsType[]} allResults - Array of all search results
 * @return {Promise<void>} - A promise that resolves to the result of the search
 */
const searchPosts = async (
    terms: string[],
    currentUser: UserModelType | null,
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
        .select(['text', 'updatedAt', 'owner'])
        .lean();

    const filteredPostResults = postResults.filter((post) => {
        const postOwner = post.owner;
        return (
            postOwner.equals(currentUser?._id) ||
            currentUser?.friends.includes(postOwner)
        );
    });

    const mappedPostResults: AllSearchResultsType[] = filteredPostResults.map(
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
 * Search for polls based on given terms and add the results to the allResults array.
 *
 * @param {string[]} terms - the search terms to filter polls
 * @param {UserModelType | null} currentUser - the current user performing the search
 * @param {AllSearchResultsType[]} allResults - array to store the search results
 * @return {Promise<void>} - A promise that resolves to the result of the search
 */
const searchPolls = async (
    terms: string[],
    currentUser: UserModelType | null,
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
        .select([
            'question',
            'description',
            'updatedAt',
            'owner',
            'isFriendOnly',
        ])
        .lean();

    const filteredPollResults = pollResults.filter((poll) => {
        const pollOwner = poll.owner;
        return (
            !poll.isFriendOnly ||
            pollOwner.equals(currentUser?._id) ||
            currentUser?.friends.includes(pollOwner)
        );
    });

    const mappedPollResults: AllSearchResultsType[] = filteredPollResults.map(
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
 * Perform a search based on the provided query and search mode.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @return {Promise<void>} a promise that resolves when the search is complete
 */
const performSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);
        const query = req.query.query as string;
        const mode = req.query.searchMode as string;

        if (!query) {
            const ERROR_MESSAGE = 'Query parameter is required!';
            res.status(400).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
            return;
        }

        const queryMode = mode ?? 'all';

        const terms = query.trim().split(' ');
        const allResults: AllSearchResultsType[] = [];

        if (queryMode === 'all' || queryMode === 'users') {
            await searchUsers(terms, allResults);
        }

        if (queryMode === 'all' || queryMode === 'posts') {
            await searchPosts(terms, currentUser, allResults);
        }

        if (queryMode === 'all' || queryMode === 'polls') {
            await searchPolls(terms, currentUser, allResults);
        }

        res.json(allResults);
    } catch (error) {
        const ERROR_MESSAGE = 'Something went wrong while searching!';
        console.error('Error searching:', error);
        res.status(500).json({
            errors: [{ msg: ERROR_MESSAGE }],
        });
    }
};

export { performSearch };

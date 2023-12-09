import { Request, Response } from 'express';
import User, { UserModelType } from '../models/user';
import Post, { PostModelType } from '../models/post';
import Poll from '../models/poll';
import { AllSearchResultsType } from '../types/searchTypes';
import { JwtUser } from '../types/jwtUser';
import { FlattenMaps } from 'mongoose';

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

    const userResults = await User.find({ $or: userRegexQueries })
        .select(['firstName', 'lastName', 'userpic'])
        .lean();

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
    currentUser: UserModelType | null,
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
            data: result,
        })
    );

    allResults.push(...mappedPostResults);
};

// Function to perform the poll search
const searchPolls = async (
    terms: string[],
    currentUser: UserModelType | null,
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

import { Request, Response } from 'express';
import User from '../models/user';
import Post, { PostModelType } from '../models/post';
import Poll from '../models/poll';
import { AllSearchResultsType } from '../types/searchTypes';
import { JwtUser } from '../types/jwtUser';

const performSearch = async (req: Request, res: Response): Promise<void> => {
    try {
        const jwtUser = req.user as JwtUser;
        const currentUser = await User.findById(jwtUser._id);
        const query = req.query.query as string;

        if (!query) {
            res.status(400).json({
                errors: [{ message: 'Query parameter is required!' }],
            });
            return;
        }

        const terms = query.split(' ');
        const allResults: AllSearchResultsType[] = [];

        const searchModel = async <T>(
            model: T,
            type: string,
            fields: string[],
            regexQueries: any
        ) => {
            const results = await (model as any)
                .find({ $or: regexQueries })
                .select(fields.join(' '))
                .lean();

            const mappedResults: AllSearchResultsType[] = results.map(
                (result: any) => ({
                    type,
                    data: result,
                })
            );

            allResults.push(...mappedResults);
        };

        const userRegexQueries = terms.map((term) => ({
            $or: [
                { firstName: { $regex: term, $options: 'i' } },
                { lastName: { $regex: term, $options: 'i' } },
                { username: { $regex: term, $options: 'i' } },
            ],
        }));

        await searchModel(
            User,
            'user',
            ['firstName', 'lastName', 'username', 'userpic'],
            userRegexQueries
        );

        const postRegexQueries = terms.map((term) => ({
            $or: [{ text: { $regex: term, $options: 'i' } }],
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

        const mappedPostResults: AllSearchResultsType[] =
            filteredPostResults.map((result: PostModelType) => ({
                type: 'post',
                data: result,
            }));

        allResults.push(...mappedPostResults);

        const pollRegexQueries = terms.map((term) => ({
            $or: [
                { question: { $regex: term, $options: 'i' } },
                { description: { $regex: term, $options: 'i' } },
            ],
        }));

        await searchModel(
            Poll,
            'poll',
            ['question', 'description', 'updatedAt'],
            pollRegexQueries
        );

        res.json(allResults);
    } catch (error) {
        console.error('Error searching:', error);
        res.status(500).json([{ message: 'Internal server error!' }]);
    }
};

export { performSearch };

import { Request, Response, NextFunction } from 'express';
import Post from '../models/post.js';
import { JwtUser } from '../types/jwtUser.js';
import User from '../models/user.js';
import { UserPostType } from '../types/userPostType.js';

/**
 * Asynchronously retrieves user posts based on the given user ID.
 *
 * @param {string} id - The ID of the user whose posts are being retrieved
 * @return {Promise<{ userPosts: UserPostType[] }>} A promise that resolves to an object containing the user's formatted posts
 */
const getPosts = async (id: string): Promise<{ userPosts: UserPostType[] }> => {
    try {
        const userPosts = await Post.find({ owner: id })
            .select('_id owner createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const formattedPosts = userPosts.map((post) => ({
            _id: post._id,
            createdAt: new Date(post.createdAt),
            owner: { _id: post.owner._id },
        }));

        return { userPosts: formattedPosts };
    } catch (err) {
        const ERROR_MESSAGE = 'Error getting feed';
        throw new Error(ERROR_MESSAGE);
    }
};

/**
 * Asynchronous function to retrieve user feed and send paginated feed as JSON response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void>} Promise that resolves when the feed is sent as JSON response
 */
const getUserFeed = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const BATCH_SIZE = 10;

    const currentUserId = (req.user as JwtUser)._id.toString();

    try {
        const currentUser = await User.findById(currentUserId).lean().exec();
        if (!currentUser) {
            const ERROR_MESSAGE = 'User not found';
            throw new Error(ERROR_MESSAGE);
        }

        const friendListIdArray = currentUser.friends.map(String);

        const postsPromisesFriends = friendListIdArray.map(getPosts);
        const postsPromiseSelf = getPosts(currentUserId);
        const postsPromises = [...postsPromisesFriends, postsPromiseSelf];
        const posts = await Promise.all(postsPromises);

        const feed = posts.flatMap((p) => p.userPosts);
        feed.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        const paginatedFeed = feed.slice(skip, skip + BATCH_SIZE);
        res.status(200).json({ paginatedFeed });
    } catch (error) {
        return next(error);
    }
};

export { getUserFeed };

import { Request, Response, NextFunction } from 'express';
import Post from '../models/post';
import { JwtUser } from '../types/jwtUser';
import User from '../models/user';
import { UserPostType } from '../types/userPostType';

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

const getUserFeed = async (req: Request, res: Response, next: NextFunction) => {
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

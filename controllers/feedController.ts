import { Request, Response, NextFunction } from 'express';
import Post, { PostType } from '../models/post';
import mongoose from 'mongoose';
import { PostDocument } from '../types/postDocument';
import { JwtUser } from '../types/jwtUser';

const getPosts = async (
    id: string
): Promise<{ userPosts: (PostType & PostDocument)[] }> => {
    try {
        const ownerId = new mongoose.Types.ObjectId(id);
        const userPosts = await Post.find({ owner: ownerId })
            .select('_id owner timestamp')
            .sort({ timestamp: -1 })
            .lean(); // Use the `lean()` method to retrieve plain JavaScript objects instead of Mongoose documents

        const formattedPosts: any[] = userPosts.map((post: any) => ({
            _id: post._id,
            timestamp: new Date(post.timestamp), // Cast the timestamp property to a Date type
            owner: { _id: post.owner._id },
        }));

        return { userPosts: formattedPosts };
    } catch (err) {
        throw new Error('Error getting feed');
    }
};

const getUserFeed = async (req: Request, res: Response, next: NextFunction) => {
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const batchSize = 10;

    const friendListIdArray = req.body.friendList;
    const feed: (PostType & PostDocument)[] = [];

    const jwtUser = req.user as JwtUser;
    const currentUserId = jwtUser._id;

    try {
        const postsPromisesFriends = friendListIdArray.map((id: string) =>
            getPosts(id)
        );
        const postsPromiseSelf = getPosts(currentUserId);
        const postsPromises = [...postsPromisesFriends, postsPromiseSelf];
        const posts = await Promise.all(postsPromises);

        posts.forEach((p) => feed.push(...p.userPosts));

        feed.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        //skip the first "skip"-number of posts and return only 10 items
        const paginatedFeed = feed.slice(skip, skip + batchSize);
        res.status(200).json({ paginatedFeed });
    } catch (error) {
        return next(error);
    }
};

export { getUserFeed };

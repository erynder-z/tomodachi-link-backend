import { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/post';
import User from '../models/user';
import { JwtUser } from '../types/jwtUser';

const addNewPost = [
    body('newPost', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),

    async (
        req: Request & { user: JwtUser },
        res: Response,
        next: NextFunction
    ) => {
        const errors = validationResult(req);
        const post = new Post({
            owner: req.user,
            timestamp: Date.now(),
            text: req.body.newPost,
            comments: [],
            reactions: [],
            // TODO: Image
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        try {
            const savedPost = await post.save();
            await User.updateOne(
                { _id: req.user._id },
                { $push: { posts: savedPost._id } }
            );
            res.status(200).json({
                title: 'Post created successfully!',
                savedPost,
            });
        } catch (err) {
            return next(err);
        }
    },
];

export { addNewPost };

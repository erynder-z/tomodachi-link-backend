import Post from '../models/post';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Comment from '../models/comment';
import Filter from 'bad-words';

const filter = new Filter();
filter.addWords(...require('badwords/array'));

const createComment = [
    body('newComment', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),

    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);

        const { id } = req.params;
        const { newComment } = req.body;
        const { user } = req;

        const comment = new Comment({
            parentPost: id,
            owner: user,
            timestamp: Date.now(),
            text: filter.clean(newComment),
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        try {
            const savedComment = await comment.save();

            await Post.updateOne(
                { _id: id },
                { $push: { comments: savedComment._id } }
            );

            res.status(200).json({
                title: 'Comment created successfully!',
                savedComment,
            });
        } catch (err) {
            return next(err);
        }
    },
];

export { createComment };

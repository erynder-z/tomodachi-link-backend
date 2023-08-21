import Post from '../models/post';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Comment from '../models/comment';
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';

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

        const matcher = new RegExpMatcher({
            ...englishDataset.build(),
            ...englishRecommendedTransformers,
        });
        const censor = new TextCensor();
        const matches = matcher.getAllMatches(newComment);

        const comment = new Comment({
            parentPost: id,
            owner: user,
            timestamp: Date.now(),
            text: censor.applyTo(newComment, matches),
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

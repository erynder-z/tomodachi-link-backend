import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import Comment from '../models/comment';
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';
import mongoose from 'mongoose';

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

        try {
            const parentItem =
                (await mongoose.model('Post').findById(id).exec()) ||
                (await mongoose.model('Poll').findById(id).exec());

            if (!parentItem) {
                return res.status(400).json({
                    error: 'Invalid parentItem ID. It must be a valid Post or Poll ID.',
                });
            }

            const matcher = new RegExpMatcher({
                ...englishDataset.build(),
                ...englishRecommendedTransformers,
            });

            const censor = new TextCensor();
            const matches = matcher.getAllMatches(newComment);

            const censoredText = censor.applyTo(newComment, matches);

            const comment = new Comment({
                parentItem: id,
                owner: user,
                /*      timestamp: Date.now(), */
                text: censoredText,
            });

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array(),
                });
            }

            const savedComment = await comment.save();

            await parentItem.updateOne({
                $push: { comments: savedComment._id },
            });

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

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

const validateCreateComment = [
    body('newComment', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
];

const createCommentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    const { id } = req.params;
    const { newComment } = req.body;
    const { user } = req;

    const ERROR_MESSAGE =
        'Invalid parentItem ID. It must be a valid Post or Poll ID.';
    const SUCCESS_MESSAGE = 'Comment created successfully!';

    try {
        const parentItem = await findParentItem(id);

        if (!parentItem) {
            return res.status(400).json({ error: ERROR_MESSAGE });
        }

        const censoredText = censorText(newComment);

        const comment = new Comment({
            parentItem: id,
            owner: user,
            text: censoredText,
        });

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const savedComment = await comment.save();

        await parentItem.updateOne({
            $push: { comments: savedComment._id },
        });

        res.status(200).json({
            title: SUCCESS_MESSAGE,
            savedComment,
        });
    } catch (err) {
        return next(err);
    }
};

const findParentItem = async (id: string) => {
    const [Post, Poll] = await Promise.all([
        mongoose.model('Post').findById(id).exec(),
        mongoose.model('Poll').findById(id).exec(),
    ]);

    return Post || Poll;
};

const censorText = (text: string) => {
    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });

    const censor = new TextCensor();
    const matches = matcher.getAllMatches(text);

    return censor.applyTo(text, matches);
};

const createComment = [...validateCreateComment, createCommentHandler];

export { createComment };

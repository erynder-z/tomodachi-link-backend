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

/**
 * Asynchronous function for handling comment creation.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | | Response<any, Record<string, any>>>} A promise representing the completion of the handling of comment creation.
 */
const createCommentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Asynchronously finds the parent item by its ID.
 *
 * @param {string} id - The ID of the parent item to be found
 * @return {Promise<Record<string, any>} A Promise that resolves to the parent item (either Post or Poll) if found, or null if not found
 */
const findParentItem = async (
    id: string
): Promise<Record<string, any> | null> => {
    const [Post, Poll] = await Promise.all([
        mongoose.model('Post').findById(id).exec(),
        mongoose.model('Poll').findById(id).exec(),
    ]);

    return Post || Poll;
};

/**
 * Censors text based on matching patterns and replaces them with censor characters.
 *
 * @param {string} text - The input text to be censored.
 * @return {string} The censored text.
 */
const censorText = (text: string): string => {
    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });

    const censor = new TextCensor();
    const matches = matcher.getAllMatches(text);

    return censor.applyTo(text, matches);
};

const validateCreateComment = [
    body('newComment', 'Text must not be empty.')
        .trim()
        .isLength({ min: 1 })
        .escape(),
];

const createComment = [...validateCreateComment, createCommentHandler];

export { createComment };

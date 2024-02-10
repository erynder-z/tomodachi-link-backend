// middleware/textCensor.ts
import { Request, Response, NextFunction } from 'express';
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';

/**
 * Middleware function to censor text in the request body.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
const textCensorMiddleware = (): import('express').RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { newPost } = req.body;

            const matcher = new RegExpMatcher({
                ...englishDataset.build(),
                ...englishRecommendedTransformers,
            });
            const censor = new TextCensor();
            const matches = matcher.getAllMatches(newPost);

            const censoredText = censor.applyTo(newPost, matches);

            req.body.newPost = censoredText;

            next();
        } catch (error) {
            next(error);
        }
    };
};

export default textCensorMiddleware;

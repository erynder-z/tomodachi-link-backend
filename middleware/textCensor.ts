// middleware/textCensor.ts
import { Request, Response, NextFunction } from 'express';
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';

const textCensorMiddleware = () => {
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

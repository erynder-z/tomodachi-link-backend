import { NextFunction, Request, Response } from 'express';
import { validateQuestion } from './validators/pollValidators/validateQuestions';
import { validateNumberOfOptions } from './validators/pollValidators/validateNumberOfOptions';
import { validateOptions } from './validators/pollValidators/validateOptions';
import { validateDescription } from './validators/pollValidators/validateDescription';
import { validateIsFriendOnly } from './validators/pollValidators/validateIsFriendOnly';
import { validateAllowComments } from './validators/pollValidators/validateAllowComments';
import { validationResult } from 'express-validator';
import { JwtUser } from '../types/jwtUser';
import {
    RegExpMatcher,
    TextCensor,
    englishDataset,
    englishRecommendedTransformers,
} from 'obscenity';
import Poll from '../models/poll';
import User from '../models/user';

const validatePoll = [
    validateQuestion(),
    validateNumberOfOptions(),
    validateOptions(),
    validateDescription(),
    validateIsFriendOnly(),
    validateAllowComments(),
];

const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
        });
    }
    next();
};

const createPoll = async (
    owner: string,
    question: string,
    numberOfOptions: number,
    options: string[],
    description: string,
    isFriendOnly: boolean,
    allowComments: boolean
) => {
    const matcher = new RegExpMatcher({
        ...englishDataset.build(),
        ...englishRecommendedTransformers,
    });
    const censor = new TextCensor();
    const questionMatches = matcher.getAllMatches(question);
    const descriptionMatches = matcher.getAllMatches(description);

    const pollOptions = options.map((option) => ({
        nameOfOption: censor.applyTo(option, questionMatches),
        selectionCount: 0,
    }));

    const poll = new Poll({
        owner,
        timestamp: Date.now(),
        question: censor.applyTo(question, questionMatches),
        numberOfOptions,
        options: pollOptions,
        description: censor.applyTo(description, descriptionMatches),
        isFriendOnly,
        allowComments,
    });
    return await poll.save();
};

const savePollToUser = async (user: JwtUser, pollId: string) => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $push: { polls: pollId } }
    );
};

const savePollInDatabase = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
            });
        }

        const reqUser = req.user as JwtUser;
        const {
            question,
            numberOfOptions,
            options,
            description,
            isFriendOnly,
            allowComments,
        } = req.body;

        const savedPoll = await createPoll(
            reqUser._id,
            question,
            numberOfOptions,
            options,
            description,
            isFriendOnly,
            allowComments
        );

        await savePollToUser(reqUser, savedPoll._id);

        res.status(200).json({
            title: 'poll created successfully!',
            savedPoll,
        });
    } catch (err) {
        return next(err);
    }
};

const addNewPoll = [
    ...validatePoll,
    handleValidationErrors,
    savePollInDatabase,
];

export { addNewPoll };

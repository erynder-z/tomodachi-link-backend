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
import mongoose from 'mongoose';

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

const submitPollAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtUser;
        const pollID = req.params.id;
        const optionID = req.body.optionID;

        const filter = {
            _id: pollID,
            'options._id': optionID,
            respondentUsers: { $ne: reqUser._id },
        };

        const update = {
            $inc: { 'options.$.selectionCount': 1 },
            $push: { respondentUsers: reqUser._id },
        };

        const options = {
            new: true,
            lean: true,
        };

        const updatedPoll = await Poll.findOneAndUpdate(
            filter,
            update,
            options
        );

        if (!updatedPoll) {
            const ERROR_MESSAGE = "You've already submitted an answer!";
            return res.status(409).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        res.status(200).json({
            updatedPoll,
        });
    } catch (err) {
        return next(err);
    }
};

const getSinglePollData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtUser;
        const reqUserID = new mongoose.Types.ObjectId(reqUser._id);
        const pollID = req.params.id;

        const retrievedPoll = await Poll.findOne({ _id: pollID })
            .populate({
                path: 'comments',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName userpic',
                },
            })
            .lean()
            .exec();

        if (!retrievedPoll) {
            const ERROR_MESSAGE = 'Poll not found';
            return res.status(404).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        const postOwnerID = retrievedPoll?.owner;
        const postOwnerPromise = User.findById(postOwnerID).exec();
        const postOwner = await postOwnerPromise;

        if (!postOwner) {
            const ERROR_MESSAGE = 'Poll owner not found';
            return res.status(404).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        const isOwner = retrievedPoll.owner.equals(reqUserID);
        const isRetrievalAllowed =
            !retrievedPoll.isFriendOnly ||
            postOwner.friends.includes(reqUserID);

        if (!isOwner && !isRetrievalAllowed) {
            const ERROR_MESSAGE = 'Forbidden!';
            return res.status(403).json({ errors: [{ msg: ERROR_MESSAGE }] });
        }

        return res.status(200).json({ retrievedPoll });
    } catch (error) {
        return next(error);
    }
};

const checkUserAnswerStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const reqUser = req.user as JwtUser;
        const pollID = req.params.id;

        const hasAlreadyAnsweredPoll = await Poll.findOne({
            _id: pollID,
            respondentUsers: reqUser._id,
        });
        if (!hasAlreadyAnsweredPoll) {
            return res.status(200).json({ canAnswer: true });
        }

        return res.status(200).json({ canAnswer: false });
    } catch (err) {
        return next(err);
    }
};

export {
    addNewPoll,
    submitPollAnswer,
    getSinglePollData,
    checkUserAnswerStatus,
};

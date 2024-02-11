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

/**
 * Handles validation errors in the Express request.
 * Sends appropriate responses if validation fails.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object used to send HTTP responses.
 * @param {NextFunction} next - The next middleware function.
 * @return {void | Response<any, Record<string, any>>} This function does not always return void; it may return a response if validation fails.
 */
const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void | Response<any, Record<string, any>> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
        });
    }
    next();
};

/**
 * Asynchronously creates a new poll.
 *
 * @param {string} owner - the owner of the poll
 * @param {string} question - the question for the poll
 * @param {number} numberOfOptions - the number of options for the poll
 * @param {string[]} options - the available options for the poll
 * @param {string} description - the description of the poll
 * @param {boolean} isFriendOnly - indicates if the poll is for friends only
 * @param {boolean} allowComments - indicates if comments are allowed for the poll
 * @return {Promise<any>} a promise that resolves with the saved poll
 */
const createPoll = async (
    owner: string,
    question: string,
    numberOfOptions: number,
    options: string[],
    description: string,
    isFriendOnly: boolean,
    allowComments: boolean
): Promise<any> => {
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

/**
 * Saves the poll to the user's list of polls.
 *
 * @param {JwtUser} user - the user for whom the poll is being saved
 * @param {string} pollId - the ID of the poll being saved
 * @return {Promise<any>} a promise that resolves to the result of updating the user's polls
 */
const savePollToUser = async (user: JwtUser, pollId: string): Promise<any> => {
    const reqUser = user as JwtUser;
    return await User.updateOne(
        { _id: reqUser._id },
        { $push: { polls: pollId } }
    );
};

/**
 * Saves a poll in the database.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void |Response<any, Record<string, any>>>} - a promise that resolves to void
 */
const savePollInDatabase = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Asynchronously submits a poll answer using the provided request, response, and next function.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void | Response<any, Record<string, any>>>} a Promise that resolves to void
 */
const submitPollAnswer = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Retrieves single poll data and handles authentication and authorization.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} a promise that resolves to the retrieved poll data or an error
 */
const getSinglePollData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Check the user's answer status for a poll.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void |Response<any, Record<string, any>>>} a promise that resolves to the user's answer status
 */
const checkUserAnswerStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
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

import { Router } from 'express';
import passport from 'passport';
import * as pollController from '../controllers/pollController.js';
import { checkAccountType } from '../middleware/checkAccountType.js';

export const pollRoute = Router();

/**
 * Route for adding a new poll.
 */
pollRoute.post(
    '/poll',
    passport.authenticate('jwt', { session: false }),
    checkAccountType(
        'regularUser',
        'This functionality is disabled for the guest account!'
    ),
    pollController.addNewPoll
);

/**
 * Route for submitting a poll answer.
 */
pollRoute.patch(
    '/poll/:id/answer',
    passport.authenticate('jwt', { session: false }),
    checkAccountType(
        'regularUser',
        'This functionality is disabled for the guest account!'
    ),
    pollController.submitPollAnswer
);

/**
 * Route for checking user answer status for a poll.
 */
pollRoute.get(
    '/poll/:id/check',
    passport.authenticate('jwt', { session: false }),
    pollController.checkUserAnswerStatus
);

/**
 * Route for getting details of a single poll.
 */
pollRoute.get(
    '/poll/:id/details',
    passport.authenticate('jwt', { session: false }),
    pollController.getSinglePollData
);

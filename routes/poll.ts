import { Router } from 'express';
import passport from 'passport';

import * as pollController from '../controllers/pollController';
import { checkAccountType } from '../middleware/checkAccountType';

export const pollRoute = Router();

pollRoute.post(
    '/poll',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    pollController.addNewPoll
);

pollRoute.patch(
    '/poll/:id/answer',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    pollController.submitPollAnswer
);

pollRoute.get(
    '/poll/:id/check',
    passport.authenticate('jwt', { session: false }),
    pollController.checkUserAnswerStatus
);

pollRoute.get(
    '/poll/:id/details',
    passport.authenticate('jwt', { session: false }),
    pollController.getSinglePollData
);

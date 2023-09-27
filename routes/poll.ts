import { Router } from 'express';
import passport from 'passport';

import * as pollController from '../controllers/pollController';

export const pollRoute = Router();

pollRoute.post(
    '/poll',
    passport.authenticate('jwt', { session: false }),
    pollController.addNewPoll
);

pollRoute.patch(
    '/poll/:id/answer',
    passport.authenticate('jwt', { session: false }),
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

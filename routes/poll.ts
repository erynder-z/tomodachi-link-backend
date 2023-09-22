import { Router } from 'express';
import passport from 'passport';

import * as pollController from '../controllers/pollController';

export const pollRoute = Router();

pollRoute.post(
    '/poll',
    passport.authenticate('jwt', { session: false }),
    pollController.addNewPoll
);

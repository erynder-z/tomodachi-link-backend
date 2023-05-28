import { Router } from 'express';
import passport from 'passport';
import * as feedController from '../controllers/feedController';

export const feedRoute = Router();

feedRoute.post(
    '/feed',
    passport.authenticate('jwt', { session: false }),
    feedController.getUserFeed
);

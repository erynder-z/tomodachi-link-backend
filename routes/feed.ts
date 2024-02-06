import { Router } from 'express';
import passport from 'passport';
import * as feedController from '../controllers/feedController';

export const feedRoute = Router();

/**
 * Route for fetching the user feed.
 */
feedRoute.get(
    '/feed',
    passport.authenticate('jwt', { session: false }),
    feedController.getUserFeed
);

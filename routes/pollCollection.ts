import { Router } from 'express';
import passport from 'passport';
import * as pollCollectionController from '../controllers/pollCollectionController';

export const pollCollectionRoute = Router();

/**
 * Route for fetching paginated poll collection.
 */
pollCollectionRoute.get(
    '/poll/collection',
    passport.authenticate('jwt', { session: false }),
    pollCollectionController.getPaginatedPollCollection
);

/**
 * Route for fetching details of a single poll.
 */
pollCollectionRoute.get(
    '/poll/:id/single',
    passport.authenticate('jwt', { session: false }),
    pollCollectionController.getSinglePoll
);

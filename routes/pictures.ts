import { Router } from 'express';
import passport from 'passport';
import * as pictureController from '../controllers/pictureController.js';

export const pictureRoute = Router();

/**
 * Route for counting the number of posted pictures of a user.
 */
pictureRoute.get(
    '/users/:id/count_pictures',
    passport.authenticate('jwt', { session: false }),
    pictureController.countPostsContainingImage
);

/**
 * Route for fetching the picture list of a user.
 */
pictureRoute.get(
    '/users/:id/picture',
    passport.authenticate('jwt', { session: false }),
    pictureController.getPictureList
);

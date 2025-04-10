import { Router } from 'express';
import passport from 'passport';
import * as pictureController from '../controllers/pictureController';

export const giphyRoute = Router();

/**
 * Route for handling Giphy search requests.
 */
giphyRoute.get(
    '/giphy-search',
    passport.authenticate('jwt', { session: false }),
    pictureController.searchGiphy
);

/**
 * Route for handling Giphy trending requests.
 */
giphyRoute.get(
    '/giphy-trending',
    passport.authenticate('jwt', { session: false }),
    pictureController.getGiphyTrending
);

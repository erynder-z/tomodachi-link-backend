import { Router } from 'express';
import passport from 'passport';
import * as friendDataController from '../controllers/friendDataController';

export const friendDataRoute = Router();

/**
 * Route for fetching friend data.
 */
friendDataRoute.get(
    '/frienddata',
    passport.authenticate('jwt', { session: false }),
    friendDataController.getFriendData
);

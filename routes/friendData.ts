import { Router } from 'express';
import passport from 'passport';
import * as friendDataController from '../controllers/friendDataController';

export const friendDataRoute = Router();

friendDataRoute.get(
    '/friendData',
    passport.authenticate('jwt', { session: false }),
    friendDataController.getFriendData
);

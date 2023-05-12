import { Router } from 'express';
import passport from 'passport';
import * as pictureController from '../controllers/pictureController';

export const pictureRoute = Router();

pictureRoute.get(
    '/users/:id/picture',
    passport.authenticate('jwt', { session: false }),
    pictureController.getRecentPictures
);

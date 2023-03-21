import { Router } from 'express';
import passport from 'passport';
import * as userDataController from '../controllers/userDataController';

export const userDataRoute = Router();

userDataRoute.get(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    userDataController.getUserData
);

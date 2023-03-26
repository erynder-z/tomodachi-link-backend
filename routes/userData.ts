import { Router } from 'express';
import passport from 'passport';
import * as userDataController from '../controllers/userDataController';

export const userDataRoute = Router();

userDataRoute.get(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    userDataController.getUserData
);

userDataRoute.put(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    userDataController.updateUserData
);

userDataRoute.patch(
    '/password',
    passport.authenticate('jwt', { session: false }),
    userDataController.updateUserPassword
);

import { Router } from 'express';
import passport from 'passport';
import * as userController from '../controllers/userController';

export const userRoute = Router();

userRoute.get(
    '/users/some',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeUsers
);

import { Router } from 'express';
import passport from 'passport';
import { handleFakeSignup, signup } from '../controllers/signupController';

export const signupRoute = Router();

/**
 * Route for regular user signup.
 */
signupRoute.post('/signup', signup);

/**
 * Route for fake user signup.
 */
signupRoute.post(
    '/fakesignup',
    passport.authenticate('jwt', { session: false }),
    handleFakeSignup
);

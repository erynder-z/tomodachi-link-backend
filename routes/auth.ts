import { Router } from 'express';
import {
    login,
    checkToken,
    getGuestLoginData,
    handleOAuthLoginCallback,
} from '../controllers/authController';
import passport from 'passport';

export const authRoute = Router();

authRoute.get('/guest', getGuestLoginData);

authRoute.post('/login', login);

authRoute.get(
    '/login/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

authRoute.get(
    '/login/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

authRoute.get(
    '/login/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: '/login',
    }),
    handleOAuthLoginCallback
);
authRoute.get(
    '/login/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login',
    }),
    handleOAuthLoginCallback
);

authRoute.get('/check-token', checkToken);

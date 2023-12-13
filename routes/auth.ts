import { Router } from 'express';
import {
    login,
    checkToken,
    getGuestLoginData,
    handleGitHubLoginCallback,
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
    '/login/github/callback',
    passport.authenticate('github', {
        session: false,
        failureRedirect: '/login',
    }),
    handleGitHubLoginCallback
);

authRoute.get('/check-token', checkToken);

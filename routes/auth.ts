import { Router } from 'express';
import {
    login,
    checkAndDecodeJwt,
    getGuestLoginData,
    handleOAuthLoginCallback,
} from '../controllers/authController';
import passport from 'passport';

export const authRoute = Router();

authRoute.get('/guest', getGuestLoginData);

authRoute.post('/login', login);

authRoute.get(
    '/oauth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

authRoute.get(
    '/oauth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

authRoute.get(
    '/oauth/discord',
    passport.authenticate('discord', { scope: ['email', 'identify'] })
);

authRoute.get(
    '/oauth/redirect',
    (req, res, next) => {
        const provider = req.query.provider as string;

        if (
            provider !== 'github' &&
            provider !== 'google' &&
            provider !== 'discord'
        ) {
            return res.redirect('/login');
        }
        passport.authenticate(provider, {
            session: false,
            failureRedirect: '/login',
        })(req, res, next);
    },
    handleOAuthLoginCallback
);

authRoute.get('/token-user', checkAndDecodeJwt);

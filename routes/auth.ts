import { Router, NextFunction, Request, Response } from 'express';

import {
    login,
    checkAndDecodeJwt,
    getGuestLoginData,
    handleOAuthLoginCallback,
} from '../controllers/authController.js';
import passport from 'passport';

export const authRoute = Router();

/**
 * Route for retrieving guest login data.
 */
authRoute.get('/guest', getGuestLoginData);

/**
 * Route for user login.
 */
authRoute.post('/login', login);

/**
 * Route for initiating GitHub OAuth authentication.
 */
authRoute.get(
    '/oauth/github',
    passport.authenticate('github', { scope: ['user:email'] })
);

/**
 * Route for initiating Google OAuth authentication.
 */
authRoute.get(
    '/oauth/google',
    passport.authenticate('google', { scope: ['email', 'profile'] })
);

/**
 * Route for initiating Discord OAuth authentication.
 */
authRoute.get(
    '/oauth/discord',
    passport.authenticate('discord', { scope: ['email', 'identify'] })
);

/**
 * Route for handling OAuth authentication callbacks.
 */
authRoute.get(
    '/oauth/redirect',
    /**
     * Middleware to handle OAuth authentication redirection.
     *
     * @param {Request} req - The request object.
     * @param {Response} res - The response object.
     * @param {NextFunction} next - The next middleware function in the stack.
     * @returns {void}
     */
    (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Route for checking and decoding JWT token.
 */
authRoute.get('/token-user', checkAndDecodeJwt);

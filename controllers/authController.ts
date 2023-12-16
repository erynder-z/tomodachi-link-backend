import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import type { UserModelType } from '../models/user';
import { LoginErrorMessage } from '../types/loginErrorMessage';

const generateToken = (user: UserModelType) => {
    const TOKEN_SECRET_KEY = process.env.TOKEN_SECRET_KEY;
    const TOKEN_EXPIRE_TIME = process.env.TOKEN_EXPIRE_TIME;

    const { _id, username, accountType } = user;
    return jwt.sign(
        {
            user: {
                _id,
                username,
                accountType,
            },
        },
        `${TOKEN_SECRET_KEY}`,
        { expiresIn: `${TOKEN_EXPIRE_TIME}` }
    );
};

const login = async (req: Request, res: Response, next: NextFunction) => {
    const AUTH_ERROR_MESSAGE = 'Error while logging in';

    passport.authenticate(
        'login',
        async (
            err: Error,
            user: UserModelType,
            authResultInfo: LoginErrorMessage
        ) => {
            if (err || !user) {
                return res
                    .status(400)
                    .json({ error: { message: authResultInfo.message } });
            }
            try {
                req.login(user, { session: false }, async (error) => {
                    if (error)
                        return res.status(400).json({
                            error: { message: AUTH_ERROR_MESSAGE },
                        });
                    const token = generateToken(user);
                    return res.status(200).json({ success: true, token });
                });
            } catch (error) {
                return res
                    .status(400)
                    .json({ error: { message: AUTH_ERROR_MESSAGE } });
            }
        }
    )(req, res, next);
};

const checkToken = async (req: Request, res: Response) => {
    const TOKEN_ERROR_MESSAGE = 'Invalid token';

    try {
        const bearerHeader = req.headers['authorization'];
        if (!bearerHeader) {
            return res.status(400).json({
                error: { message: TOKEN_ERROR_MESSAGE },
            });
        }

        const bearer = bearerHeader.split(' ');
        if (bearer.length !== 2 || bearer[0] !== 'Bearer') {
            return res.status(400).json({
                error: { message: TOKEN_ERROR_MESSAGE },
            });
        }

        const token = bearer[1];
        if (!token) {
            return res
                .status(400)
                .json({ error: { message: TOKEN_ERROR_MESSAGE } });
        }

        const SECRET = process.env.TOKEN_SECRET_KEY as string;
        const decoded = jwt.verify(token, SECRET);
        if (!decoded || typeof decoded !== 'object') {
            return res
                .status(400)
                .json({ error: { message: TOKEN_ERROR_MESSAGE } });
        }

        res.status(200).json({ user: decoded.user });
    } catch (error) {
        return res
            .status(400)
            .json({ error: { message: TOKEN_ERROR_MESSAGE } });
    }
};

const getGuestLoginData = async (req: Request, res: Response) => {
    const GUEST_USERNAME = process.env.GUEST_USERNAME;
    const GUEST_PASSWORD = process.env.GUEST_PASSWORD;
    res.status(200).json({
        guestLoginData: {
            username: GUEST_USERNAME,
            password: GUEST_PASSWORD,
        },
    });
};

const handleGitHubLoginCallback = async (req: Request, res: Response) => {
    try {
        const user: UserModelType = req.user as UserModelType;

        if (!user) {
            return res
                .status(400)
                .json({ error: { message: 'Authentication failed' } });
        }

        req.login(user, { session: false }, async (error) => {
            if (error) {
                return res
                    .status(400)
                    .json({ error: { message: 'Error while logging in' } });
            }

            const token = generateToken(user);

            const ONE_DAY_IN_MILLISECONDS = 86400000;
            const REDIRECT_URL = process.env.OAUTH_CALLBACK_REDIRECT_URL || '/';

            res.cookie('jwtOdinBook', token, {
                maxAge: ONE_DAY_IN_MILLISECONDS,
                secure: true,
                sameSite: 'strict',
            });
            res.redirect(REDIRECT_URL);
        });
    } catch (error) {
        return res
            .status(400)
            .json({ error: { message: 'Error while logging in' } });
    }
};

export { login, checkToken, getGuestLoginData, handleGitHubLoginCallback };

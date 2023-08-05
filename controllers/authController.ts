import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import type { UserModelType } from '../models/user';
import { LoginErrorMessage } from '../types/loginErrorMessage';

const generateToken = (user: UserModelType) => {
    const { _id, username } = user;
    return jwt.sign(
        {
            user: {
                _id,
                username,
            },
        },
        `${process.env.TOKEN_SECRET_KEY}`,
        { expiresIn: `${process.env.TOKEN_EXPIRE_TIME}` }
    );
};

const login = async (req: Request, res: Response, next: NextFunction) => {
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
                            error: { message: 'Error while logging in' },
                        });
                    const token = generateToken(user);
                    return res.json({ success: true, token });
                });
            } catch (error) {
                return res
                    .status(400)
                    .json({ error: { message: 'Error while authenticating' } });
            }
        }
    )(req, res, next);
};

const checkToken = async (req: Request, res: Response) => {
    try {
        const bearerHeader = req.headers['authorization'];
        if (!bearerHeader) {
            return res.status(400).json({
                error: { message: 'Authorization header is missing' },
            });
        }

        const bearer = bearerHeader.split(' ');
        if (bearer.length !== 2 || bearer[0] !== 'Bearer') {
            return res.status(400).json({
                error: { message: 'Authorization header is malformed' },
            });
        }

        const token = bearer[1];
        if (!token) {
            return res
                .status(400)
                .json({ error: { message: 'Token is missing' } });
        }

        const secret = process.env.TOKEN_SECRET_KEY as string;
        const decoded = jwt.verify(token, secret);
        if (!decoded || typeof decoded !== 'object') {
            return res
                .status(400)
                .json({ error: { message: 'Token is invalid' } });
        }

        res.status(200).json({ user: decoded.user });
    } catch (error) {
        return res
            .status(400)
            .json({ error: { message: 'Error while checking token' } });
    }
};

const getGuestLoginData = async (req: Request, res: Response) => {
    const guestUsername = process.env.GUEST_USERNAME;
    const guestPassword = process.env.GUEST_PASSWORD;
    res.status(200).json({
        guestLoginData: {
            username: guestUsername,
            password: guestPassword,
        },
    });
};

export { login, checkToken, getGuestLoginData };

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

export { login };

import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { LoginErrorMessage } from '../types/loginErrorMessage';
import type { AdminModelType } from '../models/admin';
import jwt from 'jsonwebtoken';

const generateToken = (admin: AdminModelType) => {
    const TOKEN_SECRET_KEY = process.env.ADMIN_TOKEN_SECRET_KEY;
    const TOKEN_EXPIRE_TIME = process.env.ADMIN_TOKEN_EXPIRE_TIME;

    const { _id, username } = admin;
    return jwt.sign(
        {
            user: {
                _id,
                username,
            },
        },
        `${TOKEN_SECRET_KEY}`,
        { expiresIn: `${TOKEN_EXPIRE_TIME}` }
    );
};

const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    const AUTH_ERROR_MESSAGE = 'Error while logging in';

    passport.authenticate(
        'adminLogin',
        async (
            err: Error,
            admin: AdminModelType,
            authResultInfo: LoginErrorMessage
        ) => {
            if (err || !admin) {
                return res
                    .status(400)
                    .json({ error: { message: authResultInfo.message } });
            }
            try {
                req.login(admin, { session: false }, async (error) => {
                    if (error)
                        return res.status(400).json({
                            error: { message: AUTH_ERROR_MESSAGE },
                        });
                    const token = generateToken(admin);
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
export { adminLogin };

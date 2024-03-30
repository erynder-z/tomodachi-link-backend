import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import type { UserModelType } from '../models/user';
import { LoginErrorMessage } from '../types/loginErrorMessage';

/**
 * Generates a token for the given user.
 *
 * @param {UserModelType} user - the user object for which the token is generated
 * @return {string} the generated token
 */
const generateToken = (user: UserModelType): string => {
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
        { expiresIn: TOKEN_EXPIRE_TIME }
    );
};

/**
 * Asynchronous function for user login.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @returns {Promise<void>} A promise representing the completion of the login process.
 */
const login = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

/**
 * Function to check and decode JWT token from request and send response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @returns {Promise<void | Response<any, Record<string, any>>>} A promise representing the completion of the decoding process or a response object if there's an error.
 */
const checkAndDecodeJwt = async (
    req: Request,
    res: Response
): Promise<void | Response<any, Record<string, any>>> => {
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

/**
 * Retrieves guest login data and sends it as a JSON response.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @returns {Promise<void>} A promise representing the completion of the retrieval and response sending process.
 */
const getGuestLoginData = async (
    req: Request,
    res: Response
): Promise<void> => {
    const GUEST_USERNAME = process.env.GUEST_USERNAME;
    const GUEST_PASSWORD = process.env.GUEST_PASSWORD;
    res.status(200).json({
        guestLoginData: {
            username: GUEST_USERNAME,
            password: GUEST_PASSWORD,
        },
    });
};

/**
 * Asynchronously handles the OAuth login callback.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @returns {Promise<void | Response<any, Record<string, any>>>} A promise representing the completion of the OAuth login callback process or a response object if there's an error.
 */
const handleOAuthLoginCallback = async (
    req: Request,
    res: Response
): Promise<void | Response<any, Record<string, any>>> => {
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

            return res.status(200).json({ success: true, token });
        });
    } catch (error) {
        return res
            .status(400)
            .json({ error: { message: 'Error while logging in' } });
    }
};

export {
    login,
    checkAndDecodeJwt,
    getGuestLoginData,
    handleOAuthLoginCallback,
};

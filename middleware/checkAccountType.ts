import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser.js';

/**
 * Middleware to check if the account type of the user matches the expected account type.
 * @param {string} expectedAccountType - The expected account type.
 * @param {string} [errorMsg] - Optional error message to send if the account type doesn't match.
 * @returns {(req: Request, res: Response, next: NextFunction) => void} Express middleware function.
 */
export const checkAccountType = (
    expectedAccountType: string,
    errorMsg?: string
): ((req: Request, res: Response, next: NextFunction) => void) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const reqUser = req.user as JwtUser;
        if (reqUser.accountType !== expectedAccountType) {
            if (errorMsg) {
                res.status(403).json({
                    errors: [{ msg: errorMsg }],
                });
            } else {
                res.status(403).send();
            }
        } else {
            next();
        }
    };
};

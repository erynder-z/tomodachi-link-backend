import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';

export const checkAccountType =
    (expectedAccountType: string, errorMsg?: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        const reqUser = req.user as JwtUser;
        if (reqUser.accountType !== expectedAccountType) {
            if (errorMsg) {
                return res.status(403).json({
                    errors: [
                        {
                            msg: errorMsg,
                        },
                    ],
                });
            }
            return res.status(403);
        }

        next();
    };

import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';

export const checkAccountType =
    (expectedAccountType: string) =>
    (req: Request, res: Response, next: NextFunction) => {
        const reqUser = req.user as JwtUser;
        if (reqUser.accountType !== expectedAccountType) {
            return res.status(403).json({
                errors: [
                    {
                        msg: 'This functionality is disabled for the guest account!',
                    },
                ],
            });
        }

        next();
    };

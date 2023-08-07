import { Request, Response, NextFunction } from 'express';
import { JwtUser } from '../types/jwtUser';

export const checkAccountType = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const reqUser = req.user as JwtUser;

    if (reqUser.accountType === 'guest') {
        return res.status(403).json({ message: 'Forbidden' });
    }

    next();
};

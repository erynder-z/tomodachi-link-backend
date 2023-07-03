import { NextFunction, Request, Response } from 'express';
import { JwtUser } from '../types/jwtUser';

const generateUniqueString = async (
    id1: string,
    id2: string,
    secret: string
) => {
    const { createHmac } = await import('node:crypto');
    const concatenatedString = [id1, id2].sort().join(''); // sort, so it produces the same Id for id1+id2 and id2+id1 cases
    const hash = createHmac('sha256', secret)
        .update(concatenatedString)
        .digest('hex');
    return hash;
};

const getChatroomId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const jwtUser = req.user as JwtUser;
        const currentUserId = jwtUser._id;
        const otherUserId = req.params.id;
        const secret = process.env.CHATROOM_SECRET_KEY;

        if (typeof secret !== 'string') {
            throw new Error('Invalid secret');
        }

        const chatroomId = await generateUniqueString(
            currentUserId,
            otherUserId,
            secret
        );
        res.status(200).json({ chatroomId });
    } catch (err) {
        return next(err);
    }
};

export { getChatroomId };

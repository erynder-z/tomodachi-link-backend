import { NextFunction, Request, Response } from 'express';
import { JwtUser } from '../types/jwtUser';
import ChatConversation from '../models/chatConversation';
import ChatMessage from '../models/chatMessage';

/* const generateUniqueString = async (
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
}; */

const initializeConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const sender = req.body.senderId;
    const receiver = req.body.receiverId;
    const newChatConversation = new ChatConversation({
        members: [sender, receiver],
    });

    try {
        const savedConversation = await newChatConversation.save();
        res.status(200).json(savedConversation);
    } catch (error) {
        return next(error);
    }
};

const getConversationOfSingleUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = req.params.userId;
        const conversation = await ChatConversation.find({
            members: { $in: [user] },
        });
        res.status(200).json(conversation);
    } catch (error) {
        return next(error);
    }
};

const getConversationBetweenTwoUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const firstUser = req.params.userId1;
        const secondUser = req.params.userId2;
        const conversation = await ChatConversation.findOne({
            members: { $all: [firstUser, secondUser] },
        });
        res.status(200).json(conversation);
    } catch (error) {
        return next(error);
    }
};

export {
    /*     getChatroomId, */
    initializeConversation,
    getConversationOfSingleUser,
    getConversationBetweenTwoUsers,
};

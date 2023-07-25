import { NextFunction, Request, Response } from 'express';
import ChatConversation from '../models/chatConversation';
import ChatMessage from '../models/chatMessage';
import { JwtUser } from '../types/jwtUser';

const initializeConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user) {
        const reqUser = req.user as JwtUser;
        const jwtUserId = reqUser._id;
        const chatPartnerId = req.body.chatPartnerId;

        try {
            const existingConversation = await ChatConversation.findOne({
                members: { $all: [jwtUserId, chatPartnerId] },
            });

            if (existingConversation) {
                return res.status(200).json({
                    message: 'Conversation already exists',
                    existingConversation,
                });
            }

            const newChatConversation = new ChatConversation({
                members: [jwtUserId, chatPartnerId],
            });

            const savedConversation = await newChatConversation.save();
            return res.status(200).json({
                message: 'Conversation initialized',
                savedConversation,
            });
        } catch (error) {
            return next(error);
        }
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
        res.status(200).json({ conversation });
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
        res.status(200).json({ conversation });
    } catch (error) {
        return next(error);
    }
};

const addChatMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const newMessage = new ChatMessage(req.body);
    try {
        const savedMessage = await newMessage.save();
        res.status(200).json({ savedMessage });
    } catch (error) {
        return next(error);
    }
};

const getMessagesFromConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const conversationId = req.params.conversationId;
        const messages = await ChatMessage.find({
            conversationId,
        });
        res.status(200).json({ messages });
    } catch (error) {
        return next(error);
    }
};

export {
    initializeConversation,
    getConversationOfSingleUser,
    getConversationBetweenTwoUsers,
    addChatMessage,
    getMessagesFromConversation,
};

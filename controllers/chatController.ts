import { NextFunction, Request, Response } from 'express';
import ChatConversation from '../models/chatConversation';
import ChatMessage from '../models/chatMessage';

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
        res.status(200).json({ savedConversation });
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

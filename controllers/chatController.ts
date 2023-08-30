import { NextFunction, Request, Response } from 'express';
import ChatConversation from '../models/chatConversation';
import ChatMessage from '../models/chatMessage';
import { JwtUser } from '../types/jwtUser';
import User, { UserModelType } from '../models/user';

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
                conversationStatus: [
                    {
                        member: jwtUserId,
                        hasUnreadMessage: false,
                        hasMutedConversation: false,
                    },
                    {
                        member: chatPartnerId,
                        hasUnreadMessage: false,
                        hasMutedConversation: false,
                    },
                ],
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

const getConversationOfUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.user) {
        try {
            const reqUser = req.user as JwtUser;
            const jwtUserId = reqUser._id;
            const conversation = await ChatConversation.find({
                members: { $in: [jwtUserId] },
            });
            res.status(200).json({ conversation });
        } catch (error) {
            return next(error);
        }
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

const markConversationAsUnread = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const conversationId = req.params.conversationId;
        const reqUser = req.user as JwtUser;
        const jwtUserId = reqUser._id.toString();

        const updatedConversation = await ChatConversation.findOneAndUpdate(
            {
                _id: conversationId,
                conversationStatus: {
                    $elemMatch: {
                        member: { $ne: jwtUserId },
                    },
                },
            },
            { $set: { 'conversationStatus.$.hasUnreadMessage': true } },
            { new: true }
        );

        return res.json(updatedConversation);
    } catch (error) {
        return next(error);
    }
};

const markConversationAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const conversationId = req.params.conversationId;
        const reqUser = req.user as JwtUser;
        const jwtUserId = reqUser._id.toString();

        const updatedConversation = await ChatConversation.findOneAndUpdate(
            {
                _id: conversationId,
                'conversationStatus.member': jwtUserId,
            },
            { $set: { 'conversationStatus.$.hasUnreadMessage': false } },
            { new: true }
        );

        return res.json(updatedConversation);
    } catch (error) {
        return next(error);
    }
};

const getChatPartnerData = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const otherUser = await User.findById(req.params.id);

        if (!otherUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: 'User data not found!',
                    },
                ],
            });
        }

        const userObj = formatUserData(otherUser);

        res.status(200).json({
            chatPartnerData: userObj,
        });
    } catch (err) {
        next(err);
    }
};

const formatUserData = (user: UserModelType) => {
    const { _id, firstName, lastName, username, userpic } = user;

    const formattedUser = {
        _id,
        firstName,
        lastName,
        username,
        userpic: userpic.data,
    };

    return formattedUser;
};

export {
    initializeConversation,
    getConversationOfUser,
    addChatMessage,
    getMessagesFromConversation,
    markConversationAsUnread,
    markConversationAsRead,
    getChatPartnerData,
};

import { NextFunction, Request, Response } from 'express';
import ChatConversation from '../models/chatConversation';
import ChatMessage from '../models/chatMessage';
import { JwtUser } from '../types/jwtUser';
import User, { UserModelType } from '../models/user';

/**
 * Initializes a conversation between the authenticated user and a specified chat partner.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>>}  A promise representing the completion of the conversation initialization.
 */
const initializeConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    if (!req.user) {
        return;
    }

    const reqUser = req.user as JwtUser;
    const jwtUserId = reqUser._id;
    const chatPartnerId = req.body.chatPartnerId;

    try {
        const EXISTING_CONVERSATION_MESSAGE = 'Conversation already exists';
        const SUCCESS_MESSAGE = 'Conversation initialized';

        const partner = await User.findById(chatPartnerId);

        if (partner?.accountType === 'guest') {
            return res.status(403);
        }

        const existingConversation = await ChatConversation.findOne({
            members: { $all: [jwtUserId, chatPartnerId] },
        });

        if (existingConversation) {
            return res.status(200).json({
                message: EXISTING_CONVERSATION_MESSAGE,
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
            message: SUCCESS_MESSAGE,
            savedConversation,
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Retrieves conversations of the authenticated user.
 *
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void>} A promise representing the completion of the retrieval of conversations.
 */
const getConversationOfUser = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    if (req.user) {
        try {
            const reqUser = req.user as JwtUser;
            const jwtUserId = reqUser._id;
            const conversation = await ChatConversation.find({
                members: jwtUserId,
            }).lean();
            res.status(200).json({ conversation });
        } catch (error) {
            return next(error);
        }
    }
};

/**
 * Adds a chat message to the database.
 *
 * @param {Request} req - The request object containing the chat message data.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void>} A promise representing the completion of adding the chat message.
 */
const addChatMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const savedMessage = await ChatMessage.create(req.body);
        res.status(200).json({ savedMessage });
    } catch (error) {
        return next(error);
    }
};

/**
 * Retrieves messages from a conversation.
 *
 * @param {Request} req - The request object containing the conversation ID and optional message scope.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>>} A promise representing the completion of retrieving the messages.
 */
const getMessagesFromConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const { conversationId } = req.params;
        const DEFAULT_MESSAGE_SCOPE = 'latest';
        const messageScope = req.query.messageScope || DEFAULT_MESSAGE_SCOPE;

        const ERROR_MESSAGE =
            'Something went wrong while getting your messages!';

        const query = ChatMessage.find({ conversationId });

        let messages;

        if (messageScope === 'latest') {
            messages = await query.sort({ createdAt: -1 }).limit(25);
        } else if (messageScope === 'all') {
            messages = await query.sort({ createdAt: 1 });
        } else {
            return res.status(400).json({
                errors: [{ msg: ERROR_MESSAGE }],
            });
        }

        if (messageScope === 'latest') {
            messages.reverse();
        }

        const totalMessageCount = await ChatMessage.countDocuments({
            conversationId,
        });

        res.status(200).json({ messages, totalMessageCount });
    } catch (error) {
        return next(error);
    }
};

/**
 * Marks a conversation as unread for the authenticated user.
 *
 * @param {Request} req - The request object containing the conversation ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>} A promise representing the completion of marking the conversation as unread.
 */
const markConversationAsUnread = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const conversationId = req.params.conversationId;
        const jwtUserId = (req.user as JwtUser)._id.toString();

        const updatedConversation = await ChatConversation.findOneAndUpdate(
            {
                _id: conversationId,
                conversationStatus: {
                    $elemMatch: { member: { $ne: jwtUserId } },
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

/**
 * Marks a conversation as read for the authenticated user.
 *
 * @param {Request} req - The request object containing the conversation ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>} A promise representing the completion of marking the conversation as read.
 */
const markConversationAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const conversationId = req.params.conversationId;
        const reqUser = req.user as JwtUser;
        const jwtUserId = reqUser._id.toString();

        const filter = {
            _id: conversationId,
            'conversationStatus.member': jwtUserId,
        };
        const update = {
            $set: { 'conversationStatus.$.hasUnreadMessage': false },
        };
        const options = { new: true };

        const updatedConversation = await ChatConversation.findOneAndUpdate(
            filter,
            update,
            options
        );

        return res.json(updatedConversation);
    } catch (error) {
        return next(error);
    }
};

/**
 * Retrieves data of the chat partner.
 *
 * @param {Request} req - The request object containing the chat partner ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>} A promise representing the completion of retrieving the chat partner data.
 */
const getChatPartnerData = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const ERROR_MESSAGE = 'User not found!';
        const otherUser = await User.findById(req.params.id).lean();

        if (!otherUser) {
            return res.status(404).json({
                errors: [
                    {
                        message: ERROR_MESSAGE,
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

/**
 * Handles muting/unmuting of a conversation by the authenticated user.
 *
 * @param {Request} req - The request object containing the conversation ID.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next function in the middleware chain.
 * @returns {Promise<void | Response<any, Record<string, any>>} A promise representing the completion of muting/unmuting the conversation.
 */
const handleConversationMute = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    try {
        const conversationId = req.params.conversationId;
        const jwtUserId = (req.user as JwtUser)._id.toString();
        const ERROR_MESSAGE = 'Conversation not found!';

        const conversation = await ChatConversation.findOne({
            _id: conversationId,
            'conversationStatus.member': jwtUserId,
        });

        if (!conversation) {
            return res
                .status(404)
                .json({ errors: [{ message: ERROR_MESSAGE }] });
        }

        const memberStatusIndex = conversation.conversationStatus.findIndex(
            (status) => status.member === jwtUserId
        );
        conversation.conversationStatus[
            memberStatusIndex
        ].hasMutedConversation =
            !conversation.conversationStatus[memberStatusIndex]
                .hasMutedConversation;

        const updatedConversation = await conversation.save();

        return res.json(updatedConversation);
    } catch (error) {
        return next(error);
    }
};

/**
 * Formats user data to include only necessary fields.
 *
 * @param {UserModelType} user - The user object to be formatted.
 * @returns {Object} The formatted user data.
 */
const formatUserData = (user: UserModelType): object => {
    const { _id, firstName, lastName, userpic } = user;

    const formattedUser = {
        _id,
        firstName,
        lastName,
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
    handleConversationMute,
};

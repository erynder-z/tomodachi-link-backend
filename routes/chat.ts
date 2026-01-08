import { Router } from 'express';
import passport from 'passport';
import * as chatController from '../controllers/chatController.js';
import { checkAccountType } from '../middleware/checkAccountType.js';

export const chatRoute = Router();

/**
 * Route for initializing a chat conversation.
 */
chatRoute.post(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.initializeConversation
);

/**
 * Route for fetching conversations of a user.
 */
chatRoute.get(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.getConversationOfUser
);

/**
 * Route for fetching chat partner data.
 */
chatRoute.get(
    '/chat/user/:id',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.getChatPartnerData
);

/**
 * Route for muting/unmuting a conversation.
 */
chatRoute.patch(
    '/chat/:conversationId/mute',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.handleConversationMute
);

/**
 * Route for adding a chat message to a conversation.
 */
chatRoute.post(
    '/message',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.addChatMessage
);

/**
 * Route for fetching messages from a conversation.
 */
chatRoute.get(
    '/message/:conversationId',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.getMessagesFromConversation
);

/**
 * Route for marking a conversation as unread.
 */
chatRoute.patch(
    '/message/:conversationId/unread',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.markConversationAsUnread
);

/**
 * Route for marking a conversation as read.
 */
chatRoute.patch(
    '/message/:conversationId/read',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.markConversationAsRead
);

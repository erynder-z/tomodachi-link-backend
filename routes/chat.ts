import { Router } from 'express';
import passport from 'passport';
import * as chatController from '../controllers/chatController';
import { checkAccountType } from '../middleware/checkAccountType';

export const chatRoute = Router();

chatRoute.post(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.initializeConversation
);

chatRoute.get(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.getConversationOfUser
);

chatRoute.post(
    '/message',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.addChatMessage
);

chatRoute.get(
    '/message/:conversationId',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.getMessagesFromConversation
);

chatRoute.patch(
    '/message/:conversationId/unread',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.markConversationAsUnread
);

chatRoute.patch(
    '/message/:conversationId/read',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    chatController.markConversationAsRead
);

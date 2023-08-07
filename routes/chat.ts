import { Router } from 'express';
import passport from 'passport';
import * as chatController from '../controllers/chatController';
import { checkAccountType } from '../middleware/checkAccountType';

export const chatRoute = Router();

chatRoute.post(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.initializeConversation
);

chatRoute.get(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.getConversationOfUser
);

chatRoute.post(
    '/message',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.addChatMessage
);

chatRoute.get(
    '/message/:conversationId',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.getMessagesFromConversation
);

chatRoute.patch(
    '/message/:conversationId/unread',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.markConversationAsUnread
);

chatRoute.patch(
    '/message/:conversationId/read',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    chatController.markConversationAsRead
);

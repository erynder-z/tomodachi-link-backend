import { Router } from 'express';
import passport from 'passport';
import * as chatController from '../controllers/chatController';

export const chatRoute = Router();

/* chatRoute.get(
    '/users/:id/chatroom',
    passport.authenticate('jwt', { session: false }),
    chatController.getChatroomId
); */

chatRoute.post(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    chatController.initializeConversation
);

chatRoute.get(
    '/chat',
    passport.authenticate('jwt', { session: false }),
    chatController.getConversationOfSingleUser
);

chatRoute.get(
    '/chat/:userId1/:userId2',
    passport.authenticate('jwt', { session: false }),
    chatController.getConversationBetweenTwoUsers
);

chatRoute.post(
    '/message',
    passport.authenticate('jwt', { session: false }),
    chatController.addChatMessage
);

chatRoute.get(
    '/message/:conversationId',
    passport.authenticate('jwt', { session: false }),
    chatController.getMessagesFromConversation
);

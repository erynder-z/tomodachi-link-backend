import { Router } from 'express';
import passport from 'passport';
import * as chatController from '../controllers/chatController';

export const chatRoute = Router();

chatRoute.get(
    '/users/:id/chatroom',
    passport.authenticate('jwt', { session: false }),
    chatController.getChatroomId
);

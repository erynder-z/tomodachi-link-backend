import { Router } from 'express';
import passport from 'passport';
import * as commentController from '../controllers/commentController';

export const commentRoute = Router();

commentRoute.post(
    '/post/:id/comment',
    passport.authenticate('jwt', { session: false }),
    commentController.createComment
);

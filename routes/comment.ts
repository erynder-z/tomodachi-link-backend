import { Router } from 'express';
import passport from 'passport';
import * as commentController from '../controllers/commentController';

export const commentRoute = Router();

/**
 * Route for creating a comment.
 */
commentRoute.post(
    '/comment/:id/create',
    passport.authenticate('jwt', { session: false }),
    commentController.createComment
);

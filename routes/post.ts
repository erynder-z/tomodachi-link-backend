import { Router } from 'express';
import passport from 'passport';
import * as postController from '../controllers/postController';

export const postRoute = Router();

postRoute.get(
    '/post',
    passport.authenticate('jwt', { session: false }),
    postController.getUserPosts
);

postRoute.post(
    '/post',
    passport.authenticate('jwt', { session: false }),
    postController.addNewPost
);

postRoute.patch(
    '/post/:id/positive',
    passport.authenticate('jwt', { session: false }),
    postController.positiveReaction
);

postRoute.patch(
    '/post/:id/negative',
    passport.authenticate('jwt', { session: false }),
    postController.negativeReaction
);

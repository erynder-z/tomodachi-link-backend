import { Router } from 'express';
import passport from 'passport';
import * as postController from '../controllers/postController';

export const postRoute = Router();

postRoute.post(
    '/post',
    passport.authenticate('jwt', { session: false }),
    postController.addNewPost
);

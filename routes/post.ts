import { Router } from 'express';
import passport from 'passport';
import multer from 'multer';
import * as postController from '../controllers/postController';
import textCensorMiddleware from '../middleware/textCensor';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000000 } }); // max 1 mb

export const postRoute = Router();

postRoute.get(
    '/users/:id/post',
    passport.authenticate('jwt', { session: false }),
    postController.getPosts
);

postRoute.post(
    '/post',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    textCensorMiddleware(),
    postController.addNewPost
);

postRoute.delete(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    postController.deletePost
);

postRoute.patch(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    textCensorMiddleware(),
    postController.editPost
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

postRoute.get(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    postController.getPostDetails
);

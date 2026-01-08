import { Router } from 'express';
import passport from 'passport';
import multer from 'multer';
import * as postController from '../controllers/postController.js';
import textCensorMiddleware from '../middleware/textCensor.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000000 } }); // max 1 mb

export const postRoute = Router();

/**
 * Route for fetching all posts of a user.
 */
postRoute.get(
    '/users/:id/post',
    passport.authenticate('jwt', { session: false }),
    postController.getPosts
);

/**
 * Route for adding a new post.
 */
postRoute.post(
    '/post',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    textCensorMiddleware(),
    postController.addNewPost
);

/**
 * Route for deleting a post.
 */
postRoute.delete(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    postController.deletePost
);

/**
 * Route for editing a post.
 */
postRoute.patch(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    textCensorMiddleware(),
    postController.editPost
);

/**
 * Route for adding a positive reaction to a post.
 */
postRoute.patch(
    '/post/:id/positive',
    passport.authenticate('jwt', { session: false }),
    postController.positiveReaction
);

/**
 * Route for adding a negative reaction to a post.
 */
postRoute.patch(
    '/post/:id/negative',
    passport.authenticate('jwt', { session: false }),
    postController.negativeReaction
);

/**
 * Route for fetching details of a single post.
 */
postRoute.get(
    '/post/:id',
    passport.authenticate('jwt', { session: false }),
    postController.getPostDetails
);

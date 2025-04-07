import express from 'express';
import { authRoute } from './auth';
import { signupRoute } from './signup';
import { userDataRoute } from './userData';
import { postRoute } from './post';
import { commentRoute } from './comment';
import { userRoute } from './user';
import { friendDataRoute } from './friendData';
import { pictureRoute } from './pictures';
import { feedRoute } from './feed';
import { chatRoute } from './chat';
import { pollRoute } from './poll';
import { pollCollectionRoute } from './pollCollection';
import { searchRoute } from './search';
import { adminRoute } from './admin';
import { giphyRoute } from './giphy';

/**
 * Express router for defining API routes.
 *
 * @type {express.Router}
 */
export const routes = express.Router();

/**
 * Route for user authentication.
 */
routes.use('/api/v1', authRoute);

/**
 * Route for user registration (signup).
 */
routes.use('/api/v1', signupRoute);

/**
 * Route for user data operations of the authenticated user.
 */
routes.use('/api/v1', userDataRoute);

/**
 * Route for post-related operations.
 */
routes.use('/api/v1', postRoute);

/**
 * Route for comment-related operations.
 */
routes.use('/api/v1', commentRoute);

/**
 * Route for user-related operations.
 */
routes.use('/api/v1', userRoute);

/**
 * Route for friend-related data operations.
 */
routes.use('/api/v1', friendDataRoute);

/**
 * Route for picture-related operations.
 */
routes.use('/api/v1', pictureRoute);

/**
 * Route for feed-related operations.
 */
routes.use('/api/v1', feedRoute);

/**
 * Route for chat-related operations.
 */
routes.use('/api/v1', chatRoute);

/**
 * Route for poll-related operations.
 */
routes.use('/api/v1', pollRoute);

/**
 * Route for poll collection operations.
 */
routes.use('/api/v1', pollCollectionRoute);

/**
 * Route for search-related operations.
 */
routes.use('/api/v1', searchRoute);

/**
 * Route for admin-related operations.
 */
routes.use('/api/v1', adminRoute);

/**
 * Route for gifhy-related operations.
 */
routes.use('/api/v1', giphyRoute);

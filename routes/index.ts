import express from 'express';
import { authRoute } from './auth.js';
import { signupRoute } from './signup.js';
import { userDataRoute } from './userData.js';
import { postRoute } from './post.js';
import { commentRoute } from './comment.js';
import { userRoute } from './user.js';
import { friendDataRoute } from './friendData.js';
import { pictureRoute } from './pictures.js';
import { feedRoute } from './feed.js';
import { chatRoute } from './chat.js';
import { pollRoute } from './poll.js';
import { pollCollectionRoute } from './pollCollection.js';
import { searchRoute } from './search.js';
import { adminRoute } from './admin.js';
import { giphyRoute } from './giphy.js';

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

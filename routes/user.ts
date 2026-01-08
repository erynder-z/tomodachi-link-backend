import { Router } from 'express';
import passport from 'passport';
import * as userController from '../controllers/userController.js';

export const userRoute = Router();

/**
 * Route for counting all users in the database.
 */
userRoute.get('/users/count', userController.countUsers);

/**
 * Route for fetching a selection of random users.
 */
userRoute.get(
    '/users/some',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeUsers
);

/**
 * Route for fetching all users.
 */
userRoute.get(
    '/users/all',
    passport.authenticate('jwt', { session: false }),
    userController.getAllUsers
);

/**
 * Route for fetching a selection of friends of friends.
 */
userRoute.get(
    '/users/maybefriends',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeFriendsOfFriends
);

/**
 * Route for fetching user data of other users.
 */
userRoute.get(
    '/users/:id',
    passport.authenticate('jwt', { session: false }),
    userController.getOtherUserData
);

/**
 * Route for sending a friend request.
 */
userRoute.patch(
    '/users/:id/request/send',
    passport.authenticate('jwt', { session: false }),
    userController.sendFriendRequest
);

/**
 * Route for accepting a friend request.
 */
userRoute.patch(
    '/users/:id/request/accept',
    passport.authenticate('jwt', { session: false }),
    userController.acceptFriendRequest
);

/**
 * Route for declining a friend request.
 */
userRoute.patch(
    '/users/:id/request/decline',
    passport.authenticate('jwt', { session: false }),
    userController.declineFriendRequest
);

/**
 * Route for unfriending a user.
 */
userRoute.patch(
    '/users/:id/request/unfriend',
    passport.authenticate('jwt', { session: false }),
    userController.unfriendUser
);

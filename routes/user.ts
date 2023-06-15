import { Router } from 'express';
import passport from 'passport';
import * as userController from '../controllers/userController';

export const userRoute = Router();

userRoute.get(
    '/users',
    passport.authenticate('jwt', { session: false }),
    userController.searchUsers
);

userRoute.get(
    '/users/some',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeUsers
);

userRoute.get(
    '/users/maybefriends',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeFriendsOfFriends
);

userRoute.get(
    '/users/:id',
    passport.authenticate('jwt', { session: false }),
    userController.getOtherUserData
);

userRoute.patch(
    '/users/:id/friendrequest',
    passport.authenticate('jwt', { session: false }),
    userController.sendFriendRequest
);

userRoute.patch(
    '/users/:id/acceptfriendrequest',
    passport.authenticate('jwt', { session: false }),
    userController.acceptFriendRequest
);

userRoute.patch(
    '/users/:id/declinefriendrequest',
    passport.authenticate('jwt', { session: false }),
    userController.declineFriendRequest
);

userRoute.patch(
    '/users/:id/unfriend',
    passport.authenticate('jwt', { session: false }),
    userController.unfriendUser
);

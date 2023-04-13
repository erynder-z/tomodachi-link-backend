import { Router } from 'express';
import passport from 'passport';
import * as userController from '../controllers/userController';

export const userRoute = Router();

userRoute.get(
    '/users/some',
    passport.authenticate('jwt', { session: false }),
    userController.getSomeUsers
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

import { Router } from 'express';
import {
    adminLogin,
    adminGetPosts,
    adminDeletePost,
    adminGetUsers,
    adminGetPolls,
    adminDeletePoll,
} from '../controllers/adminController';
import passport from 'passport';

export const adminRoute = Router();

adminRoute.post('/admin/login', adminLogin);

adminRoute.get(
    '/admin/posts',
    passport.authenticate('jwt', { session: false }),
    adminGetPosts
);

adminRoute.delete(
    '/admin/post/:id',
    passport.authenticate('jwt', { session: false }),
    adminDeletePost
);

adminRoute.get(
    '/admin/users',
    passport.authenticate('jwt', { session: false }),
    adminGetUsers
);

adminRoute.get(
    '/admin/polls',
    passport.authenticate('jwt', { session: false }),
    adminGetPolls
);

adminRoute.delete(
    '/admin/poll/:id',
    passport.authenticate('jwt', { session: false }),
    adminDeletePoll
);

import { Router } from 'express';
import {
    adminLogin,
    adminGetPosts,
    adminDeletePost,
    adminGetUsers,
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

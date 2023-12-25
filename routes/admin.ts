import { Router } from 'express';
import { adminLogin, adminGetPosts } from '../controllers/adminController';
import passport from 'passport';

export const adminRoute = Router();

adminRoute.post('/admin/login', adminLogin);

adminRoute.get(
    '/admin/posts',
    passport.authenticate('jwt', { session: false }),
    adminGetPosts
);

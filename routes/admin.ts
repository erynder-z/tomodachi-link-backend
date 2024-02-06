import { Router } from 'express';
import {
    adminLogin,
    adminGetPosts,
    adminDeletePost,
    adminGetUsers,
    adminGetPolls,
    adminDeletePoll,
    adminPerformSearch,
    adminGetDashboardData,
} from '../controllers/adminController';
import passport from 'passport';

export const adminRoute = Router();

/**
 * Route for admin login.
 */
adminRoute.post('/admin/login', adminLogin);

/**
 * Route for fetching dashboard data.
 */
adminRoute.get(
    '/admin/dashboard',
    passport.authenticate('jwt', { session: false }),
    adminGetDashboardData
);

/**
 * Route for fetching posts.
 */
adminRoute.get(
    '/admin/posts',
    passport.authenticate('jwt', { session: false }),
    adminGetPosts
);

/**
 * Route for deleting a post.
 */
adminRoute.delete(
    '/admin/post/:id',
    passport.authenticate('jwt', { session: false }),
    adminDeletePost
);

/**
 * Route for fetching users.
 */
adminRoute.get(
    '/admin/users',
    passport.authenticate('jwt', { session: false }),
    adminGetUsers
);

/**
 * Route for fetching polls.
 */
adminRoute.get(
    '/admin/polls',
    passport.authenticate('jwt', { session: false }),
    adminGetPolls
);

/**
 * Route for deleting a poll.
 */
adminRoute.delete(
    '/admin/poll/:id',
    passport.authenticate('jwt', { session: false }),
    adminDeletePoll
);

/**
 * Route for performing search.
 */
adminRoute.get(
    '/admin/search',
    passport.authenticate('jwt', { session: false }),
    adminPerformSearch
);

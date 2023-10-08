import { Router } from 'express';
import passport from 'passport';
import * as searchController from '../controllers/searchController';

export const searchRoute = Router();

searchRoute.get(
    '/search',
    passport.authenticate('jwt', { session: false }),
    searchController.performSearch
);

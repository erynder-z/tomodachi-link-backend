import { Router } from 'express';
import passport from 'passport';
import * as getApiKeysController from '../controllers/getApiKeysController';

export const getApiKeysRoute = Router();

/**
 * Route for retrieving Tenor API key.
 */
getApiKeysRoute.get(
    '/key/tenor',
    passport.authenticate('jwt', { session: false }),
    getApiKeysController.getTenorKey
);

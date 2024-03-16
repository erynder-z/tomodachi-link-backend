import { Router } from 'express';
import passport from 'passport';
import * as userDataController from '../controllers/userDataController';
import multer from 'multer';
import { checkAccountType } from '../middleware/checkAccountType';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000000 } }); // max 1 mb

export const userDataRoute = Router();

/**
 * Route for fetching user data of the authenticated user.
 */
userDataRoute.get(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    userDataController.getUserData
);

/**
 * Route for updating user data of the authenticated user.
 */
userDataRoute.put(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    checkAccountType('regularUser'),
    userDataController.updateUserData
);

/**
 * Route for updating cover image of the authenticated user.
 */
userDataRoute.patch(
    '/userdata/cover',
    passport.authenticate('jwt', { session: false }),
    userDataController.updateCover
);

/**
 * Route for updating the password of the authenticated user.
 */
userDataRoute.patch(
    '/password',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    userDataController.updateUserPassword
);

/**
 * Route for accepting some TOS for the authenticated user.
 */
userDataRoute.put(
    '/tos/accept',
    passport.authenticate('jwt', { session: false }),
    checkAccountType('regularUser'),
    userDataController.acceptTOS
);

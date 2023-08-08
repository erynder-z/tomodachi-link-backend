import { Router } from 'express';
import passport from 'passport';
import * as userDataController from '../controllers/userDataController';
import multer from 'multer';
import { checkAccountType } from '../middleware/checkAccountType';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 1000000 } }); // max 1 mb

export const userDataRoute = Router();

userDataRoute.get(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    userDataController.getUserData
);

userDataRoute.put(
    '/userdata',
    passport.authenticate('jwt', { session: false }),
    upload.single('imagePicker'),
    checkAccountType,
    userDataController.updateUserData
);

userDataRoute.patch(
    '/userdata/cover',
    passport.authenticate('jwt', { session: false }),
    userDataController.updateCover
);

userDataRoute.patch(
    '/password',
    passport.authenticate('jwt', { session: false }),
    checkAccountType,
    userDataController.updateUserPassword
);

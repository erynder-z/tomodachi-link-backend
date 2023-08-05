import { Router } from 'express';
import {
    login,
    checkToken,
    getGuestLoginData,
} from '../controllers/authController';

export const authRoute = Router();

authRoute.get('/guest', getGuestLoginData);

authRoute.post('/login', login);

authRoute.get('/check-token', checkToken);

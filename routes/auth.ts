import { Router } from 'express';
import { login, checkToken } from '../controllers/authController';

export const authRoute = Router();

authRoute.post('/login', login);

authRoute.get('/check-token', checkToken);

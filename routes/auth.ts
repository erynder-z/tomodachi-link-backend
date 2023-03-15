import { Router } from 'express';
import { login } from '../controllers/authController';

export const authRoute = Router();

authRoute.post('/login', login);

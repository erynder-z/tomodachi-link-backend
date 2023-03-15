import { Router } from 'express';
import signup from '../controllers/signupController';

export const signupRoute = Router();

signupRoute.post('/signup', signup);

import { Router } from 'express';
import signup from '../controllers/signup-controller';

export const signupRoute = Router();

signupRoute.post('/signup', signup);

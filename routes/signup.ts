import { Router } from 'express';
import { handleFakeSignup, signup } from '../controllers/signupController';

export const signupRoute = Router();

signupRoute.post('/signup', signup);

signupRoute.post('/fakesignup', handleFakeSignup);

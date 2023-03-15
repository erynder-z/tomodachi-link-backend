import express from 'express';
import { authRoute } from './auth';
import { signupRoute } from './signup';

export const routes = express.Router();

routes.use('/api/v1', signupRoute);
routes.use('/api/v1', authRoute);

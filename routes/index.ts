import express from 'express';
import { signupRoute } from './signup';

export const routes = express.Router();

routes.use(signupRoute);

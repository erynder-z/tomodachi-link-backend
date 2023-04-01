import express from 'express';
import { authRoute } from './auth';
import { signupRoute } from './signup';
import { userDataRoute } from './userData';
import { postRoute } from './post';

export const routes = express.Router();

routes.use('/api/v1', signupRoute);
routes.use('/api/v1', authRoute);
routes.use('/api/v1', userDataRoute);
routes.use('/api/v1', postRoute);

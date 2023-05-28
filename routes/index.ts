import express from 'express';
import { authRoute } from './auth';
import { signupRoute } from './signup';
import { userDataRoute } from './userData';
import { postRoute } from './post';
import { commentRoute } from './comment';
import { userRoute } from './user';
import { friendDataRoute } from './friendData';
import { getApiKeysRoute } from './apiKeys';
import { pictureRoute } from './pictures';
import { feedRoute } from './feed';

export const routes = express.Router();

routes.use('/api/v1', signupRoute);
routes.use('/api/v1', authRoute);
routes.use('/api/v1', userDataRoute);
routes.use('/api/v1', postRoute);
routes.use('/api/v1', pictureRoute);
routes.use('/api/v1', commentRoute);
routes.use('/api/v1', userRoute);
routes.use('/api/v1', friendDataRoute);
routes.use('/api/v1', getApiKeysRoute);
routes.use('/api/v1', feedRoute);

import express, { Express } from 'express';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import { routes } from './routes';
import errorMiddleware from './middleware/error-handler';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { initializePassport } from './passport/initializePassport';
import { initializeMongoDB } from './mongodb/initializeMongoDB';
import passport from 'passport';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';

import { initializeSocketIo } from './socket/initializeSocketIo';

const app: Express = express();
dotenv.config();

initializeMongoDB();
initializePassport();

const allowedOrigins = JSON.parse(process.env.CORS_ACCESS || '[]');
const oauthCallbackUrls = JSON.parse(process.env.CORS_ACCESS_OAUTH || '[]');

const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        if (!origin || oauthCallbackUrls?.includes(origin)) {
            callback(null, true);
        } else if (allowedOrigins?.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));
app.use(passport.initialize());
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(compression());

app.use('/', routes);

app.use(errorMiddleware);

const server: http.Server = http.createServer(app);
initializeSocketIo(server, corsOptions);

server.listen(process.env.PORT, () => {
    console.log(`now listening on port ${process.env.PORT}`);
});

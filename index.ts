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

import { initializeSocketIo } from './socket/initializeSocketIo';

const app: Express = express();
dotenv.config();

initializeMongoDB();
initializePassport();

const corsOptions = {
    origin: function (origin: any, callback: any) {
        if (process.env.CORS_ACCESS?.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
};

app.use(cors(corsOptions));

/* app.use(cors()); */

app.use(passport.initialize());
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use(errorMiddleware);

const server: http.Server = http.createServer(app);
initializeSocketIo(server, corsOptions);

server.listen(process.env.PORT, () => {
    console.log(`now listening on port ${process.env.PORT}`);
});

import express, { Express, Request, Response, NextFunction } from 'express';
import * as dotenv from 'dotenv';
import { routes } from './routes';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

const app: Express = express();
dotenv.config();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.listen(process.env.PORT, () => {
  console.log(`now listening on port ${process.env.PORT}`);
});

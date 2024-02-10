import { Request, Response } from 'express';

type Error = {
    name: string;
    message: string;
    stack?: string;
    status?: number;
};

/**
 * Middleware for handling errors in the application.
 *
 * @param {Error} err - The error object being handled
 * @param {Request} req - The incoming request
 * @param {Response} res - The outgoing response
 * @return {void}
 */
function errorMiddleware(err: Error, req: Request, res: Response): void {
    const status = err.status || 500;
    const message =
        err.message +
        (process.env.NODE_ENV === 'development' ? `\n${err.stack}` : '');

    res.status(status).json({
        message,
    });
}

export default errorMiddleware;

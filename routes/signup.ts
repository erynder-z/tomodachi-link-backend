import { Request, Response, NextFunction, Router } from 'express';

export const signupRoute = Router();

signupRoute.get(
  '/',
  function (req: Request, res: Response, next: NextFunction) {
    res.send('Signup under construction!');
  }
);

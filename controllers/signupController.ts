import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { validationResult } from 'express-validator';

import { validateFirstName } from './validators/signupValidators/validateFirstName';
import { validateLastName } from './validators/signupValidators/validateLastName';
import { validateEmail } from './validators/signupValidators/validateEmail';
import { validateUsername } from './validators/signupValidators/validateUsername';
import { validatePassword } from './validators/signupValidators/validatePassword';
import { validateConfirmPassword } from './validators/signupValidators/validateConfirmPassword';
import { validateImage } from './validators/signupValidators/validateImage';

const validateSignup = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validateUsername(),
    validatePassword(),
    validateConfirmPassword(),
    validateImage(),
];

const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
        });
    }
    next();
};

const handleSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    passport.authenticate('signup', { session: false }, (err: Error) => {
        if (err) {
            return next(err);
        }
        res.json({
            message:
                'Signed-up successfully! Please log in to explore the app!',
            user: req.user,
        });
    })(req, res, next);
};

const signup = [...validateSignup, handleValidationErrors, handleSignup];

export default signup;

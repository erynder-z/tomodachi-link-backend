import { NextFunction, Request, Response } from 'express';
import passport from 'passport';
import { validationResult } from 'express-validator';
import { validateFirstName } from './validators/signupValidators/validateFirstName';
import { validateLastName } from './validators/signupValidators/validateLastName';
import { validateEmail } from './validators/signupValidators/validateEmail';
import { validateUsername } from './validators/signupValidators/validateUsername';
import { validatePassword } from './validators/signupValidators/validatePassword';
import { validateConfirmPassword } from './validators/signupValidators/validateConfirmPassword';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import User from '../models/user';

const validateSignup = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validateUsername(),
    validatePassword(),
    validateConfirmPassword(),
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

        const SUCCESS_MESSAGE =
            'Signed-up successfully! Please log in to explore the app!';

        res.json({
            message: SUCCESS_MESSAGE,
            user: req.user,
        });
    })(req, res, next);
};

const signup = [...validateSignup, handleValidationErrors, handleSignup];

const handleFakeSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { password } = req.body;
        const fakeSignupPassword = process.env.FAKE_SIGNUP_PASSWORD;

        if (password !== fakeSignupPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const createRandomUser = async () => {
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const email = faker.internet.email();
            const username = faker.internet.userName();
            const userpic = faker.internet.avatar();

            const fetchImage = async (
                url: string
            ): Promise<{ data: Buffer; contentType: string }> => {
                const response = await fetch(url);
                const blob = await response.blob();

                const buffer = Buffer.from(await blob.arrayBuffer());

                return {
                    data: buffer,
                    contentType: response.headers.get('content-type') || '',
                };
            };

            const convertedUserpic = await fetchImage(userpic);
            const hashedPassword = await bcrypt.hash(password, 10);

            return {
                firstName,
                lastName,
                email,
                username,
                password: hashedPassword,
                userpic: convertedUserpic,
                accountType: 'fake',
            };
        };

        const user = await createRandomUser();
        const savedUser = await User.create(user);

        res.json({
            message: 'Fake signup successful!',
            savedUser,
        });
    } catch (err) {
        return next(err);
    }
};

export { signup, handleFakeSignup };

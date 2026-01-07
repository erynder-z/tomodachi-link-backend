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
import Admin from '../models/admin';
import { JwtAdmin } from '../types/jwtAdmin';

const validateSignup = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validateUsername(),
    validatePassword(),
    validateConfirmPassword(),
];

/**
 * Handles validation errors for incoming requests.
 *
 * @param {Request} req - the incoming request
 * @param {Response} res - the outgoing response
 * @param {NextFunction} next - the next function
 * @return {void | Response<any, Record<string, any>>} - this function does not always return void; it may return a response if validation fails
 */
const handleValidationErrors = (
    req: Request,
    res: Response,
    next: NextFunction
): void | Response<any, Record<string, any>> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array(),
        });
    }
    next();
};

/**
 * Handles user signup and returns a success message and user information.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next function
 * @return {Promise<void>} - a promise that resolves to void and sends the expected response
 */
const handleSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
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

/**
 * Handles fake signup process by creating a random user with fake data and saving it to the database.
 *
 * @param {Request} req - the request object
 * @param {Response} res - the response object
 * @param {NextFunction} next - the next middleware function
 * @return {Promise<void | Response<any, Record<string, any>>>} Promise that resolves with the result of the signup process
 */
const handleFakeSignup = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void | Response<any, Record<string, any>>> => {
    const reqUser = req.user as JwtAdmin;
    const isAdmin = await Admin.exists({ _id: reqUser });

    if (!isAdmin) {
        res.status(403).json({ errors: [{ msg: 'Forbidden' }] });
        return;
    }

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
            const username = faker.internet.username();
            const userpic = faker.image.avatar();
            const about = faker.lorem.sentence({ min: 5, max: 15 });

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
            const provider: { name: 'tomodachi' } = { name: 'tomodachi' };
            const accountType = 'fake';

            return {
                firstName,
                lastName,
                email,
                username,
                password: hashedPassword,
                userpic: convertedUserpic,
                about,
                accountType,
                provider,
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

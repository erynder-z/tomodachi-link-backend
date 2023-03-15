import passport from 'passport';
import { Strategy as localStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../../models/user';

export const initializeSignup = () => {
    passport.use(
        'signup',
        new localStrategy(
            {
                usernameField: 'username',
                passwordField: 'password',
                passReqToCallback: true,
            },
            async (req, username, password, done) => {
                try {
                    const { email, first_name, last_name } = req.body;
                    bcrypt.hash(password, 10, async (err, hashedPassword) => {
                        if (err) {
                            return done(null, false, {
                                message: 'Error processing password!',
                            });
                        }
                        const user = await User.create({
                            username,
                            password: hashedPassword,
                            email,
                            first_name,
                            last_name,
                        });
                        return done(null, user);
                    });
                } catch (error) {
                    console.log(error);
                    return done(error);
                }
            }
        )
    );
};

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
                    const { email, firstName, lastName } = req.body;
                    bcrypt.hash(password, 10, async (err, hashedPassword) => {
                        if (err) {
                            return done(null, false, {
                                message: 'Error processing password!',
                            });
                        }

                        let accountType = 'regularUser';
                        if (username === 'guest') {
                            accountType = 'guest';
                        }

                        const user = await User.create({
                            username,
                            password: hashedPassword,
                            email,
                            firstName: firstName,
                            lastName: lastName,
                            accountType: accountType,
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

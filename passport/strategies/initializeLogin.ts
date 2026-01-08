import passport from 'passport';
import { Strategy as localStrategy } from 'passport-local';
import bcrypt from 'bcrypt';
import User from '../../models/user.js';

/**
 * Initializes the login strategy using passport.
 *
 * @return {void}
 */
export const initializeLogin = (): void => {
    passport.use(
        'login',
        new localStrategy(async (username, password, done) => {
            try {
                const user = await User.findOne({ username });
                if (!user) {
                    return done(null, false, {
                        message: 'Invalid username',
                    });
                }
                const passwordMatches = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!passwordMatches) {
                    return done(null, false, {
                        message: 'Invalid password',
                    });
                }
                return done(null, user, { message: 'Logged in successfully!' });
            } catch (error) {
                console.log(error);
                return done(error);
            }
        })
    );
};

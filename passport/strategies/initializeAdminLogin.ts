import passport from 'passport';
import { Strategy as localStrategy } from 'passport-local';
import bcrypt from 'bcrypt';

import Admin from '../../models/admin';

/**
 * Initializes the admin login using passport local strategy.
 *
 * @return {void}
 */
export const initializeAdminLogin = (): void => {
    const ADMIN_HASHED_PASSWORD = process.env.ADMIN_HASHED_PASSWORD;

    passport.use(
        'adminLogin',
        new localStrategy(async (username, providedPassword, done) => {
            if (ADMIN_HASHED_PASSWORD) {
                try {
                    const admin = await Admin.findOne({ username });
                    if (!admin) {
                        return done(null, false, {
                            message: 'Invalid username',
                        });
                    }

                    const passwordMatches = await bcrypt.compare(
                        providedPassword,
                        ADMIN_HASHED_PASSWORD
                    );

                    if (!passwordMatches) {
                        return done(null, false, {
                            message: 'Invalid password',
                        });
                    }

                    return done(null, admin, {
                        message: 'Logged in successfully!',
                    });
                } catch (error) {
                    console.log(error);
                    return done(error);
                }
            } else return done(null);
        })
    );
};

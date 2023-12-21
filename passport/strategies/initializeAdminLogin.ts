import passport from 'passport';
import { Strategy as localStrategy } from 'passport-local';

import Admin from '../../models/admin';

export const initializeAdminLogin = () => {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    passport.use(
        'adminLogin',
        new localStrategy(async (username, providedPassword, done) => {
            try {
                const admin = await Admin.findOne({ username });
                if (!admin) {
                    return done(null, false, {
                        message: 'Invalid username',
                    });
                }
                const storedPassword = ADMIN_PASSWORD;

                if (providedPassword !== storedPassword) {
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
        })
    );
};

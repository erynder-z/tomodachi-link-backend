import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/user';
import bcrypt from 'bcrypt';

export const initializeGoogleLogin = () => {
    const GOOGLE_CLIENT_ID = `${process.env.GOOGLE_CLIENT_ID}`;
    const GOOGLE_CLIENT_SECRET = `${process.env.GOOGLE_CLIENT_SECRET}`;
    const GOOGLE_CALLBACK_URL = `${process.env.GOOGLE_CALLBACK_URL}`;
    const GOOGLE_OAUTH_PLACEHOLDER_PASSWORD = `${process.env.GOOGLE_OAUTH_PLACEHOLDER_PASSWORD}`;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
        throw new Error(
            'Google client ID, secret key, and callback URL must be defined'
        );
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: GOOGLE_CLIENT_ID,
                clientSecret: GOOGLE_CLIENT_SECRET,
                callbackURL: GOOGLE_CALLBACK_URL,
            },
            async (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                accessToken: any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                refreshToken: any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                profile: any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                cb: any
            ) => {
                const user = await User.findOne({
                    'provider.name': 'google',
                    'provider.profileId': profile.id,
                });

                if (!user) {
                    console.log('Adding new github user to DB..');

                    const hashedPlaceholderPassword = await bcrypt.hash(
                        GOOGLE_OAUTH_PLACEHOLDER_PASSWORD,
                        10
                    );

                    const user = await User.create({
                        username: profile._json.name,
                        password: hashedPlaceholderPassword,
                        provider: {
                            name: 'google',
                            profileId: profile.id,
                        },

                        email: profile._json.email,
                        firstName: profile._json.given_name || 'Google',
                        lastName: profile._json.family_name,
                        accountType: 'regularUser',
                    });

                    await user.save();

                    return cb(null, user);
                } else {
                    console.log('Github user already exist in DB..');
                    return cb(null, user);
                }
            }
        )
    );
};

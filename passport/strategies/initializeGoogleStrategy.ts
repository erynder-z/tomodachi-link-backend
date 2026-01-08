import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../../models/user.js';
import bcrypt from 'bcrypt';
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import { generateUsernameFromEmail } from '../../helpers/generateUsernameFromEmail.js';

/**
 * Initializes Google login using the provided environment variables for Google client ID, secret, and callback URL.
 *
 * @return {void}
 */
export const initializeGoogleLogin = (): void => {
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
                const existingUser = await User.findOne({
                    'provider.name': 'google',
                    'provider.profileId': profile.id,
                });

                if (!existingUser) {
                    console.log('Adding new google user to DB..');

                    const hashedPlaceholderPassword = await bcrypt.hash(
                        GOOGLE_OAUTH_PLACEHOLDER_PASSWORD,
                        10
                    );

                    const username =
                        profile._json.name ||
                        generateUsernameFromEmail(profile._json.email);
                    const firstName =
                        profile._json.given_name ||
                        uniqueNamesGenerator({
                            dictionaries: [colors],
                        });
                    const lastName =
                        profile._json.family_name ||
                        uniqueNamesGenerator({
                            dictionaries: [animals],
                        });

                    const newUser = await User.create({
                        username: username,
                        password: hashedPlaceholderPassword,
                        provider: {
                            name: 'google',
                            profileId: profile.id,
                        },

                        email: profile._json.email,
                        firstName,
                        lastName,
                        accountType: 'regularUser',
                    });

                    await newUser.save();

                    return cb(null, newUser);
                } else {
                    console.log('Google user already exist in DB..');
                    return cb(null, existingUser);
                }
            }
        )
    );
};

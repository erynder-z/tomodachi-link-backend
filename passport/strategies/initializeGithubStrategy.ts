import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../../models/user.js';
import bcrypt from 'bcrypt';
import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';
import { generateUsernameFromEmail } from '../../helpers/generateUsernameFromEmail.js';

/**
 * Initializes the GitHub login strategy using the provided environment variables for client ID, secret, and callback URL.
 *
 * @return {void}
 */
export const initializeGithubLogin = (): void => {
    const GITHUB_CLIENT_ID = `${process.env.GITHUB_CLIENT_ID}`;
    const GITHUB_CLIENT_SECRET = `${process.env.GITHUB_CLIENT_SECRET}`;
    const GITHUB_CALLBACK_URL = `${process.env.GITHUB_CALLBACK_URL}`;
    const GITHUB_OAUTH_PLACEHOLDER_PASSWORD = `${process.env.GITHUB_OAUTH_PLACEHOLDER_PASSWORD}`;

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !GITHUB_CALLBACK_URL) {
        throw new Error(
            'GitHub client ID, secret key, and callback URL must be defined'
        );
    }

    passport.use(
        new GitHubStrategy(
            {
                clientID: GITHUB_CLIENT_ID,
                clientSecret: GITHUB_CLIENT_SECRET,
                callbackURL: GITHUB_CALLBACK_URL,
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
                    'provider.name': 'github',
                    'provider.profileId': profile._json.id,
                });

                if (!existingUser) {
                    console.log('Adding new github user to DB..');

                    const getFirstName = (name: string) => {
                        const nameArray = name?.split(' ');
                        return nameArray && nameArray.length > 0
                            ? nameArray[0]
                            : null;
                    };

                    const getLastName = (name: string) => {
                        const nameArray = name?.split(' ');
                        return nameArray && nameArray.length > 1
                            ? nameArray[1]
                            : null;
                    };

                    const hashedPlaceholderPassword = await bcrypt.hash(
                        GITHUB_OAUTH_PLACEHOLDER_PASSWORD,
                        10
                    );

                    const username =
                        profile._json.login ||
                        generateUsernameFromEmail(profile.email);
                    const firstName =
                        getFirstName(profile._json.name) ||
                        profile.username ||
                        uniqueNamesGenerator({
                            dictionaries: [colors],
                        });
                    const lastName =
                        getLastName(profile._json.name) ||
                        uniqueNamesGenerator({
                            dictionaries: [animals],
                        });

                    const newUser = await User.create({
                        username: username,
                        password: hashedPlaceholderPassword,
                        provider: {
                            name: 'github',
                            profileId: profile._json.id,
                        },

                        email: profile._json.email || 'none',
                        firstName: firstName,
                        lastName: lastName,
                        accountType: 'regularUser',
                    });

                    await newUser.save();

                    return cb(null, newUser);
                } else {
                    console.log('Github user already exist in DB..');
                    return cb(null, existingUser);
                }
            }
        )
    );
};

import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../../models/user';
import bcrypt from 'bcrypt';

export const initializeGithubLogin = () => {
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
                const user = await User.findOne({
                    'provider.name': 'github',
                    'provider.profileId': profile._json.id,
                });

                if (!user) {
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

                    const user = await User.create({
                        username: profile._json.login,
                        password: hashedPlaceholderPassword,
                        provider: {
                            name: 'github',
                            profileId: profile._json.id,
                        },

                        email: profile._json.email,
                        firstName:
                            getFirstName(profile._json.name) ||
                            profile.username,
                        lastName: getLastName(profile._json.name) || 'Github',
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

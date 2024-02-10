import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import User from '../../models/user';
import bcrypt from 'bcrypt';

/**
 * Initializes Discord login using Discord OAuth strategy.
 *
 * @return {void}
 */
export const initializeDiscordLogin = (): void => {
    const DISCORD_CLIENT_ID = `${process.env.DISCORD_CLIENT_ID}`;
    const DISCORD_CLIENT_SECRET = `${process.env.DISCORD_CLIENT_SECRET}`;
    const DISCORD_CALLBACK_URL = `${process.env.DISCORD_CALLBACK_URL}`;
    const DISCORD_OAUTH_PLACEHOLDER_PASSWORD = `${process.env.DISCORD_OAUTH_PLACEHOLDER_PASSWORD}`;

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_CALLBACK_URL) {
        throw new Error(
            'Discord client ID, secret key, and callback URL must be defined'
        );
    }

    passport.use(
        new DiscordStrategy(
            {
                clientID: DISCORD_CLIENT_ID,
                clientSecret: DISCORD_CLIENT_SECRET,
                callbackURL: DISCORD_CALLBACK_URL,
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
                    'provider.name': 'discord',
                    'provider.profileId': profile.id,
                });

                if (!user) {
                    console.log('Adding new discord user to DB..');

                    const hashedPlaceholderPassword = await bcrypt.hash(
                        DISCORD_OAUTH_PLACEHOLDER_PASSWORD,
                        10
                    );

                    const user = await User.create({
                        username: profile.username,
                        password: hashedPlaceholderPassword,
                        provider: {
                            name: 'discord',
                            profileId: profile.id,
                        },

                        email: profile.email,
                        firstName: profile.global_name,
                        lastName: 'Discord',
                        accountType: 'regularUser',
                    });

                    await user.save();

                    return cb(null, user);
                } else {
                    console.log('Discord user already exist in DB..');
                    return cb(null, user);
                }
            }
        )
    );
};

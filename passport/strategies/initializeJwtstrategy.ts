import passport from 'passport';
import { Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt';

/**
 * Initializes the JWT authentication strategy using the provided token secret key.
 *
 * @return {void}
 */
export const initializeJWT = (): void => {
    passport.use(
        new JWTstrategy(
            {
                secretOrKey: process.env.TOKEN_SECRET_KEY,
                jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            },
            async (token, done) => {
                try {
                    return done(null, token.user);
                } catch (error) {
                    console.log(error);
                    return done(error);
                }
            }
        )
    );
};

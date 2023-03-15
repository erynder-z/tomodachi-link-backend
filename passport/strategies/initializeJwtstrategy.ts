import passport from 'passport';
import { Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt';

export const initializeJWT = () => {
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

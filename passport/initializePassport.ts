import { initializeJWT } from './strategies/initializeJwtstrategy';
import { initializeSignup } from './strategies/initializeSignup';
import { initializeLogin } from './strategies/initializeLogin';
import { initializeGithubLogin } from './strategies/initializeGithubStrategy';
import { initializeGoogleLogin } from './strategies/initializeGoogleStrategy';
import { initializeDiscordLogin } from './strategies/initializeDiscordStrategy';
import { initializeAdminLogin } from './strategies/initializeAdminLogin';

/**
 * Initializes the passport by initializing JWT, signup, login, admin login, github login, google login, and discord login.
 */
export const initializePassport = () => {
    initializeJWT();
    initializeSignup();
    initializeLogin();
    initializeAdminLogin();
    initializeGithubLogin();
    initializeGoogleLogin();
    initializeDiscordLogin();
};

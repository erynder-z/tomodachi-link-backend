import { initializeJWT } from './strategies/initializeJwtstrategy.js';
import { initializeSignup } from './strategies/initializeSignup.js';
import { initializeLogin } from './strategies/initializeLogin.js';
import { initializeGithubLogin } from './strategies/initializeGithubStrategy.js';
import { initializeGoogleLogin } from './strategies/initializeGoogleStrategy.js';
import { initializeDiscordLogin } from './strategies/initializeDiscordStrategy.js';
import { initializeAdminLogin } from './strategies/initializeAdminLogin.js';

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

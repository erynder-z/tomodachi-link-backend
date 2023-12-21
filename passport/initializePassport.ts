import { initializeJWT } from './strategies/initializeJwtstrategy';
import { initializeSignup } from './strategies/initializeSignup';
import { initializeLogin } from './strategies/initializeLogin';
import { initializeGithubLogin } from './strategies/initializeGithubStrategy';
import { initializeGoogleLogin } from './strategies/initializeGoogleStrategy';
import { initializeDiscordLogin } from './strategies/initializeDiscordStrategy';
import { initializeAdminLogin } from './strategies/initializeAdminLogin';

export const initializePassport = () => {
    initializeJWT();
    initializeSignup();
    initializeLogin();
    initializeAdminLogin();
    initializeGithubLogin();
    initializeGoogleLogin();
    initializeDiscordLogin();
};

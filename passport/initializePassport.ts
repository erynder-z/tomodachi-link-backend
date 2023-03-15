import { initializeJWT } from './strategies/initializeJwtstrategy';
import { initializeSignup } from './strategies/initializeSignup';
import { initializeLogin } from './strategies/initializeLogin';

export const initializePassport = () => {
    initializeJWT();
    initializeSignup();
    initializeLogin();
};

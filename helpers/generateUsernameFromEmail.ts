import { uniqueNamesGenerator, colors, animals } from 'unique-names-generator';

/**
 * Generate a username from the given email.
 *
 * @param {string} email - the email to generate the username from
 * @return {string} the generated username
 */
export const generateUsernameFromEmail = (email: string) => {
    const username = email.split('@')[0];
    const randomName = uniqueNamesGenerator({
        dictionaries: [colors, animals],
    });
    return username ? username : randomName;
};

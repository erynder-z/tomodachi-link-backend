export type JwtUser = {
    _id: string;
    username: string;
    accountType: 'regularUser' | 'guest';
};

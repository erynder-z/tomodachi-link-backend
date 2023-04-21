export type MinimalUserTypes = {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
};

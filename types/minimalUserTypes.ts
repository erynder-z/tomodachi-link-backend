export type MinimalUserTypes = {
    _id: string;
    firstName: string;
    lastName: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
};

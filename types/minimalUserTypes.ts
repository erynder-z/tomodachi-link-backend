export type MinimalUserTypes = {
    _id: string;
    first_name: string;
    last_name: string;
    username: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
};

import { Types } from 'mongoose';

export type MinimalUserTypes = {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
};

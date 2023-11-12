import { Types } from 'mongoose';

export type UserPostType = {
    _id: Types.ObjectId;
    createdAt: Date;
    owner: {
        _id: Types.ObjectId;
    };
};

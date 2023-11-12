import mongoose from 'mongoose';

export type PostDocument = mongoose.Document<any, any, any> & {
    _id: mongoose.Types.ObjectId;
    owner: { _id: string };
    createdAt: Date;
    updatedAt: Date;
};

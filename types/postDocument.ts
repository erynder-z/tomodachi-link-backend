import mongoose from 'mongoose';

export type PostDocument = mongoose.Document<any, any, any> & {
    _id: mongoose.Types.ObjectId;
    timestamp: Date;
    owner: { _id: string };
};

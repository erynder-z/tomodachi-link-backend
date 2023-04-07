import mongoose, { Schema, Document, Types, Date } from 'mongoose';

export type CommentType = {
    parentPost: Types.ObjectId;
    owner: Types.ObjectId;
    timestamp: Date;
    text: string;
};

type CommentModelType = CommentType & Document;

const CommentSchema: Schema = new Schema(
    {
        parentPost: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, required: true },
        text: { type: String, required: true },
    },
    { versionKey: false }
);

export default mongoose.model<CommentModelType>('Comment', CommentSchema);

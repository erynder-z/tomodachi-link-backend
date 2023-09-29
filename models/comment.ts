import mongoose, { Schema, Document, Types } from 'mongoose';

export type CommentType = {
    parentItem: Types.ObjectId;
    owner: Types.ObjectId;
    text: string;
};

type CommentModelType = CommentType & Document;

const CommentSchema: Schema = new Schema(
    {
        parentItem: {
            type: Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
    },

    { versionKey: false, timestamps: true }
);

export default mongoose.model<CommentModelType>('Comment', CommentSchema);

import mongoose, { Schema, Document, Types, Date } from 'mongoose';

export type PostType = {
    owner: Types.ObjectId[];
    timestamp: Date;
    text: string;
    image: {
        data: Buffer;
        contentType: string;
    };
    comments: Types.ObjectId[];
    reactions: Types.ObjectId[];
};

type PostModelType = PostType & Document;

const PostSchema: Schema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, required: true },
        text: { type: String, required: true },
        image: {
            data: Buffer,
            contentType: String,
        },
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        reactions: [{ type: Schema.Types.ObjectId, ref: 'Reaction' }],
    },
    { versionKey: false }
);

export default mongoose.model<PostModelType>('Post', PostSchema);

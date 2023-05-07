import mongoose, { Schema, Document, Types, Date } from 'mongoose';

export type PostType = {
    owner: Types.ObjectId;
    timestamp: Date;
    text: string;
    image: {
        data: Buffer;
        contentType: string;
    };
    embeddedVideoID: string;
    comments: Types.ObjectId[];
    reactions: {
        positive: number;
        negative: number;
        reacted_users: Types.ObjectId[];
    };
};

type PostModelType = PostType & Document;

const PostSchema: Schema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: {
            type: Date,
            required: true,
            immutable: true,
            default: () => Date.now(),
        },
        text: { type: String, required: true },
        image: {
            data: Buffer,
            contentType: String,
        },
        embeddedVideoID: { type: String },
        comments: {
            type: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
            default: [],
        },
        reactions: {
            type: {
                positive: { type: Number, default: 0 },
                negative: { type: Number, default: 0 },
                reacted_users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
            },
            default: { positive: 0, negative: 0 },
        },
    },
    { versionKey: false }
);

export default mongoose.model<PostModelType>('Post', PostSchema);

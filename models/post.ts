import mongoose, { Schema, Document, Types } from 'mongoose';

export type PostType = {
    _id: Types.ObjectId;
    owner: Types.ObjectId;
    text: string;
    image: {
        data: Buffer;
        contentType: string;
    };
    embeddedVideoID: string;
    gifUrl: string;
    comments: Types.ObjectId[];
    reactions: {
        positive: number;
        negative: number;
        reacted_users: Types.ObjectId[];
    };
    updatedAt: Date;
};

export type PostModelType = PostType & Document;

const PostSchema: Schema = new Schema(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        image: {
            data: Buffer,
            contentType: String,
        },
        embeddedVideoID: { type: String },
        gifUrl: { type: String },
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
    { versionKey: false, timestamps: true }
);

export default mongoose.model<PostModelType>('Post', PostSchema);

import mongoose, { Schema, Document, Types, Date } from 'mongoose';

export type PostType = {
    owner: Types.ObjectId[];
    timestamp: Date;
    title: string;
    text: string;
    image: {
        data: Buffer;
        contentType: string;
    };
    comments: Types.ObjectId[];
    reactions: Types.ObjectId[];
    tags: Types.ObjectId[];
};

type PostModelType = PostType & Document;

const PostSchema: Schema = new Schema(
    {
        owner: { type: String, required: true },
        timestamp: { type: Date, required: true },
        title: { type: String, required: true },
        text: { type: String, required: true },
        image: {
            data: Buffer,
            contentType: String,
        },
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
        reactions: [{ type: Schema.Types.ObjectId, ref: 'Reaction' }],
        tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    },
    { versionKey: false }
);

export default mongoose.model<PostModelType>('Post', PostSchema);

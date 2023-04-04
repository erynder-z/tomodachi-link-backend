import mongoose, { Schema, Document, Types } from 'mongoose';
import path from 'path';
import fs from 'fs';

export type UserType = {
    first_name: string;
    last_name: string;
    username: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
    email: string;
    password: string;
    friends: Types.ObjectId[];
    posts: Types.ObjectId[];
    bookmarks: Types.ObjectId[];
    joined: Date;
    last_seen: Date;
    pending_friend_requests: Types.ObjectId[];
};

export type UserModelType = UserType & Document;

const UserSchema: Schema = new Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        username: { type: String, required: true },
        userpic: {
            data: {
                type: Buffer,
                default: () => {
                    return fs.readFileSync(
                        path.resolve(
                            __dirname,
                            '../../public/images/defaultUserpic.png'
                        )
                    );
                },
            },
            contentType: String,
        },
        email: { type: String, required: true },
        password: { type: String, required: true },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        bookmarks: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        joined: {
            type: Date,
            required: true,
            immutable: true,
            default: () => Date.now,
        },
        last_seen: { type: Date, required: true, default: () => Date.now },
        pending_friend_requests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    { versionKey: false }
);

export default mongoose.model<UserModelType>('User', UserSchema);

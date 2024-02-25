import mongoose, { Schema, Document, Types } from 'mongoose';
import path from 'path';
import fs from 'fs';
import { CoverType } from '../types/coverType';

export type UserType = {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    username: string;
    userpic: {
        data: Buffer;
        contentType: string;
    };
    cover: CoverType;
    email: string;
    password: string;
    friends: Types.ObjectId[];
    posts: Types.ObjectId[];
    polls: Types.ObjectId[];
    joined: Date;
    lastSeen: Date;
    pendingFriendRequests: Types.ObjectId[];
    accountType: 'regularUser' | 'guest' | 'fake';
    provider: {
        name: 'tomodachi' | 'github' | 'google' | 'discord';
        profileId: string;
    };

    createdAt: Date;
    updatedAt: Date;
};

export type UserModelType = UserType & Document;

const UserSchema: Schema = new Schema(
    {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
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
        cover: { type: String, required: true, default: 'none' },
        email: { type: String, required: true },
        password: { type: String, required: true },
        friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        polls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
        joined: {
            type: Date,
            required: true,
            immutable: true,
            default: () => Date.now(),
        },
        lastSeen: { type: Date, required: true, default: () => Date.now() },
        pendingFriendRequests: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        accountType: {
            type: String,
            enum: ['regularUser', 'guest', 'fake'],
            default: 'regularUser',
            required: true,
        },
        provider: {
            name: {
                type: String,
                enum: ['tomodachi', 'github', 'google', 'discord'],
                required: true,
            },
            profileId: { type: String },
        },
    },
    { versionKey: false }
);

export default mongoose.model<UserModelType>('User', UserSchema);

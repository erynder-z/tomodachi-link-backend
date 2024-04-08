import mongoose, { Schema, Document, Types } from 'mongoose';

export type AdminType = {
    _id: Types.ObjectId;
    username: string;
    email: string;
    password: string;
};

export type AdminModelType = AdminType & Document;

const AdminSchema: Schema = new Schema(
    {
        username: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
    },
    { versionKey: false, timestamps: true }
);

export default mongoose.model<AdminModelType>('Admin', AdminSchema);

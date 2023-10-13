import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChatMessageType = {
    _id: Types.ObjectId;
    conversationId: string;
    senderId: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
};

type ChatMessageModelType = ChatMessageType & Document;

const ChatMessageSchema: Schema = new Schema(
    {
        conversationId: { type: String },
        senderId: { type: String },
        text: { type: String },
    },
    { versionKey: false, timestamps: true }
);

export default mongoose.model<ChatMessageModelType>(
    'ChatMessage',
    ChatMessageSchema
);

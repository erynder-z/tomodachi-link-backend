import mongoose, { Schema, Document } from 'mongoose';

export type ChatMessageType = {
    conversationId: string;
    senderId: string;
    text: string;
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

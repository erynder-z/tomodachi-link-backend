import mongoose, { Schema, Document } from 'mongoose';

export type ChatMessageType = {
    members: string[];
};

type ChatMessageModelType = ChatMessageType & Document;

const ChatMessageSchema: Schema = new Schema(
    {
        conversationId: { type: String },
        sender: { type: String },
        text: { type: String },
    },
    { versionKey: false, timestamps: true }
);

export default mongoose.model<ChatMessageModelType>(
    'ChatMessage',
    ChatMessageSchema
);

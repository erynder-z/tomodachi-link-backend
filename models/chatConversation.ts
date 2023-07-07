import mongoose, { Schema, Document } from 'mongoose';

export type ChatConversationType = {
    members: string[];
};

type ChatConversationModelType = ChatConversationType & Document;

const ChatConversationSchema: Schema = new Schema(
    {
        members: {
            type: Array,
        },
    },
    { versionKey: false, timestamps: true }
);

export default mongoose.model<ChatConversationModelType>(
    'ChatConversation',
    ChatConversationSchema
);

import mongoose, { Schema, Document } from 'mongoose';

export type ChatConversationType = {
    members: string[];
    conversationStatus: {
        member: string;
        hasUnreadMessage: boolean;
        hasMutedConversation: boolean;
    }[];
};

type ChatConversationModelType = ChatConversationType & Document;

const ChatConversationSchema: Schema = new Schema(
    {
        members: {
            type: Array,
        },
        conversationStatus: [
            {
                member: String,
                hasUnreadMessage: { type: Boolean, default: false },
                hasMutedConversation: { type: Boolean, default: false },
            },
        ],
    },
    { versionKey: false, timestamps: true }
);

export default mongoose.model<ChatConversationModelType>(
    'ChatConversation',
    ChatConversationSchema
);

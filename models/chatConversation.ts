import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChatConversationType = {
    _id: Types.ObjectId;
    members: string[];
    conversationStatus: {
        member: string;
        hasUnreadMessage: boolean;
        hasMutedConversation: boolean;
    }[];
    createdAt: Date;
    updatedAt: Date;
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

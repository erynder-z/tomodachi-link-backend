import mongoose, { Schema, Document } from 'mongoose';

export type ReactionType = {
    positive: number;
    neutral: number;
    negative: number;
};

type ReactionModelType = ReactionType & Document;

const ReactionSchema: Schema = new Schema(
    {
        positive: { type: Number, required: true, default: 0 },
        neutral: { type: Number, required: true, default: 0 },
        negative: { type: Number, required: true, default: 0 },
    },
    { versionKey: false }
);

export default mongoose.model<ReactionModelType>('Reaction', ReactionSchema);

import mongoose, { Document } from 'mongoose';
import { QuestionType } from '../types';
export interface IVote {
    studentId: string;
    studentName: string;
    option: string;
    votedAt: Date;
    isCorrect?: boolean;
    score?: number;
}
export interface IPollResult {
    option: string;
    count: number;
    percentage: number;
    textResponses?: string[];
}
export interface IPoll extends Document {
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer?: string;
    isAnonymous: boolean;
    timer: number;
    roomCode: string;
    startTime: Date;
    endTime?: Date;
    status: 'active' | 'completed';
    votes: IVote[];
    results: IPollResult[];
    createdAt: Date;
}
declare const _default: mongoose.Model<IPoll, {}, {}, {}, mongoose.Document<unknown, {}, IPoll> & IPoll & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;

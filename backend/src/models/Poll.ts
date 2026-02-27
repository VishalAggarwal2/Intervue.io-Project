import mongoose, { Schema, Document } from 'mongoose';
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

const VoteSchema = new Schema<IVote>({
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  option: { type: String, required: true },
  votedAt: { type: Date, default: Date.now },
  isCorrect: { type: Boolean },
  score: { type: Number, default: 0 },
});

const PollResultSchema = new Schema<IPollResult>({
  option: { type: String, required: true },
  count: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  textResponses: [{ type: String }],
});

const PollSchema = new Schema<IPoll>(
  {
    question: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'truefalse', 'rating', 'openended'],
      default: 'mcq',
    },
    options: [{ type: String }],
    correctAnswer: { type: String },
    isAnonymous: { type: Boolean, default: false },
    timer: { type: Number, required: true, min: 5, max: 300 },
    roomCode: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    votes: [VoteSchema],
    results: [PollResultSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IPoll>('Poll', PollSchema);

import mongoose, { Schema, Document } from 'mongoose';
import { TemplateQuestion } from '../types';

export interface ITemplate extends Document {
  name: string;
  questions: TemplateQuestion[];
  createdAt: Date;
}

const TemplateQuestionSchema = new Schema<TemplateQuestion>({
  question: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'truefalse', 'rating', 'openended'], default: 'mcq' },
  options: [{ type: String }],
  correctAnswer: { type: String },
  timer: { type: Number, default: 60 },
  isAnonymous: { type: Boolean, default: false },
});

const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    questions: [TemplateQuestionSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ITemplate>('Template', TemplateSchema);

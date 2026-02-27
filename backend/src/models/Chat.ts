import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  sender: string;
  role: 'teacher' | 'student';
  message: string;
  timestamp: Date;
}

const ChatSchema = new Schema<IChat>({
  sender: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student'], required: true },
  message: { type: String, required: true, maxlength: 500 },
  timestamp: { type: Date, default: Date.now },
});

ChatSchema.index({ timestamp: -1 });

export default mongoose.model<IChat>('Chat', ChatSchema);

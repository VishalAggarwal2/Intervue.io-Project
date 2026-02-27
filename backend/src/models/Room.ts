import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IRoom extends Document {
  roomCode: string;
  name: string;
  status: 'active' | 'closed';
  polls: Types.ObjectId[];
  createdAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, default: 'Untitled Room' },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    polls: [{ type: Schema.Types.ObjectId, ref: 'Poll' }],
  },
  { timestamps: true }
);

export default mongoose.model<IRoom>('Room', RoomSchema);

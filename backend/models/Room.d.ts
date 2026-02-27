import mongoose, { Document, Types } from 'mongoose';
export interface IRoom extends Document {
    roomCode: string;
    name: string;
    status: 'active' | 'closed';
    polls: Types.ObjectId[];
    createdAt: Date;
}
declare const _default: mongoose.Model<IRoom, {}, {}, {}, mongoose.Document<unknown, {}, IRoom> & IRoom & {
    _id: Types.ObjectId;
}, any>;
export default _default;

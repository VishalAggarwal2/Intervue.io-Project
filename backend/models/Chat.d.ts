import mongoose, { Document } from 'mongoose';
export interface IChat extends Document {
    sender: string;
    role: 'teacher' | 'student';
    message: string;
    timestamp: Date;
}
declare const _default: mongoose.Model<IChat, {}, {}, {}, mongoose.Document<unknown, {}, IChat> & IChat & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;

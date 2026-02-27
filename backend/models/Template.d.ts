import mongoose, { Document } from 'mongoose';
import { TemplateQuestion } from '../types';
export interface ITemplate extends Document {
    name: string;
    questions: TemplateQuestion[];
    createdAt: Date;
}
declare const _default: mongoose.Model<ITemplate, {}, {}, {}, mongoose.Document<unknown, {}, ITemplate> & ITemplate & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;

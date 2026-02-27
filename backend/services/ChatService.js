"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Chat_1 = __importDefault(require("../models/Chat"));
class ChatService {
    async saveMessage(sender, role, message) {
        const chat = new Chat_1.default({ sender, role, message });
        await chat.save();
        return {
            id: chat._id.toString(),
            sender: chat.sender,
            role: chat.role,
            message: chat.message,
            timestamp: chat.timestamp,
        };
    }
    async getRecentMessages(limit = 50) {
        const messages = await Chat_1.default.find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        return messages.reverse().map((m) => ({
            id: m._id.toString(),
            sender: m.sender,
            role: m.role,
            message: m.message,
            timestamp: m.timestamp,
        }));
    }
}
exports.default = new ChatService();
//# sourceMappingURL=ChatService.js.map
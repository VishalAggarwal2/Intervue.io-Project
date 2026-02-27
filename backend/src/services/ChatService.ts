import ChatModel from '../models/Chat';
import { ChatMessage } from '../types';

class ChatService {
  async saveMessage(
    sender: string,
    role: 'teacher' | 'student',
    message: string
  ): Promise<ChatMessage> {
    const chat = new ChatModel({ sender, role, message });
    await chat.save();

    return {
      id: chat._id.toString(),
      sender: chat.sender,
      role: chat.role,
      message: chat.message,
      timestamp: chat.timestamp,
    };
  }

  async getRecentMessages(limit = 50): Promise<ChatMessage[]> {
    const messages = await ChatModel.find()
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

export default new ChatService();

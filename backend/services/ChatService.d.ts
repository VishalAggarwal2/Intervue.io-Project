import { ChatMessage } from '../types';
declare class ChatService {
    saveMessage(sender: string, role: 'teacher' | 'student', message: string): Promise<ChatMessage>;
    getRecentMessages(limit?: number): Promise<ChatMessage[]>;
}
declare const _default: ChatService;
export default _default;

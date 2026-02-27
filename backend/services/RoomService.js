"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Room_1 = __importDefault(require("../models/Room"));
const Poll_1 = __importDefault(require("../models/Poll"));
function generateRoomCode() {
    // Unambiguous characters only
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
class RoomService {
    async createRoom(name) {
        let roomCode;
        let attempts = 0;
        // Ensure uniqueness
        do {
            roomCode = generateRoomCode();
            attempts++;
            if (attempts > 20)
                throw new Error('Failed to generate unique room code');
        } while (await Room_1.default.exists({ roomCode }));
        const room = new Room_1.default({ roomCode, name: name || 'Untitled Room' });
        await room.save();
        return room;
    }
    async getRoom(roomCode) {
        return Room_1.default.findOne({ roomCode: roomCode.toUpperCase() });
    }
    async getRoomWithPolls(roomCode) {
        return Room_1.default.findOne({ roomCode: roomCode.toUpperCase() }).populate('polls');
    }
    async addPollToRoom(roomCode, pollId) {
        await Room_1.default.findOneAndUpdate({ roomCode: roomCode.toUpperCase() }, { $push: { polls: pollId } });
    }
    async closeRoom(roomCode) {
        await Room_1.default.findOneAndUpdate({ roomCode: roomCode.toUpperCase() }, { status: 'closed' });
    }
    /**
     * Returns per-student analytics for all polls in the room.
     */
    async getStudentReport(roomCode) {
        const polls = await Poll_1.default.find({
            roomCode: roomCode.toUpperCase(),
            status: 'completed',
        }).lean();
        const studentMap = new Map();
        for (const poll of polls) {
            for (const vote of poll.votes) {
                if (!studentMap.has(vote.studentId)) {
                    studentMap.set(vote.studentId, {
                        name: vote.studentName,
                        answered: 0,
                        correct: 0,
                        score: 0,
                        polls: [],
                    });
                }
                const entry = studentMap.get(vote.studentId);
                entry.answered++;
                const isCorrect = vote.isCorrect ?? false;
                if (isCorrect) {
                    entry.correct++;
                    entry.score += vote.score ?? 0;
                }
                entry.polls.push({
                    question: poll.question,
                    option: vote.option,
                    correct: isCorrect,
                });
            }
        }
        return Array.from(studentMap.entries()).map(([studentId, data]) => ({
            studentId,
            studentName: data.name,
            totalAnswered: data.answered,
            correctAnswers: data.correct,
            score: data.score,
            accuracy: data.answered > 0 ? Math.round((data.correct / data.answered) * 100) : 0,
            details: data.polls,
        }));
    }
}
exports.default = new RoomService();
//# sourceMappingURL=RoomService.js.map
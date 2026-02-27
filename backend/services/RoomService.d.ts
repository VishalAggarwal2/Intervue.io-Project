import { IRoom } from '../models/Room';
declare class RoomService {
    createRoom(name?: string): Promise<IRoom>;
    getRoom(roomCode: string): Promise<IRoom | null>;
    getRoomWithPolls(roomCode: string): Promise<(import("mongoose").Document<unknown, {}, IRoom> & IRoom & {
        _id: import("mongoose").Types.ObjectId;
    }) | null>;
    addPollToRoom(roomCode: string, pollId: string): Promise<void>;
    closeRoom(roomCode: string): Promise<void>;
    /**
     * Returns per-student analytics for all polls in the room.
     */
    getStudentReport(roomCode: string): Promise<{
        studentId: string;
        studentName: string;
        totalAnswered: number;
        correctAnswers: number;
        score: number;
        accuracy: number;
        details: {
            question: string;
            option: string;
            correct: boolean;
        }[];
    }[]>;
}
declare const _default: RoomService;
export default _default;

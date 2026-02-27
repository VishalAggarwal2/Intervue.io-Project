import { EventEmitter } from 'events';
import { IPoll } from '../models/Poll';
import { PollResult, QuestionType } from '../types';
declare class PollService extends EventEmitter {
    private activePollByRoom;
    private pollTimerByRoom;
    /** Restore active polls from DB on server startup */
    initialize(): Promise<void>;
    createPoll(roomCode: string, question: string, type: QuestionType, options: string[], timer: number, correctAnswer?: string, isAnonymous?: boolean): Promise<IPoll>;
    getActivePoll(roomCode: string): IPoll | null;
    getRemainingTime(roomCode: string): number;
    submitVote(roomCode: string, pollId: string, studentId: string, studentName: string, option: string): Promise<{
        success: boolean;
        results: PollResult[];
        isCorrect?: boolean;
        message?: string;
    }>;
    endPoll(roomCode: string): Promise<PollResult[]>;
    getPollHistory(roomCode: string): Promise<IPoll[]>;
    /** Replay a past poll — creates a fresh poll with same config */
    replayPoll(roomCode: string, pollId: string): Promise<IPoll>;
    private getResults;
    private recalculateResults;
    private scheduleTimer;
}
declare const _default: PollService;
export default _default;

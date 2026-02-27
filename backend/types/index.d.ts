export type QuestionType = 'mcq' | 'truefalse' | 'rating' | 'openended';
export interface PollResult {
    option: string;
    count: number;
    percentage: number;
    textResponses?: string[];
}
export interface Vote {
    studentId: string;
    studentName: string;
    option: string;
    votedAt: Date;
    isCorrect?: boolean;
    score?: number;
}
export interface Student {
    socketId: string;
    studentId: string;
    name: string;
    votedInCurrentPoll: boolean;
}
export interface LeaderboardEntry {
    studentId: string;
    studentName: string;
    score: number;
    totalAnswered: number;
    correctAnswers: number;
}
export interface ChatMessage {
    id: string;
    sender: string;
    role: 'teacher' | 'student';
    message: string;
    timestamp: Date;
}
export interface TemplateQuestion {
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer?: string;
    timer: number;
    isAnonymous: boolean;
}
export interface QueuedPoll {
    question: string;
    type: QuestionType;
    options: string[];
    timer: number;
    correctAnswer?: string;
    isAnonymous: boolean;
}

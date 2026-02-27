export type QuestionType = 'mcq' | 'truefalse' | 'rating' | 'openended';
export type PollStatus = 'idle' | 'active' | 'ended';
export type UserRole = 'teacher' | 'student' | null;

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
  votedAt: string;
  isCorrect?: boolean;
  score?: number;
}

export interface PollData {
  _id: string;
  question: string;
  type: QuestionType;
  options: string[];
  correctAnswer?: string;
  isAnonymous: boolean;
  timer: number;
  roomCode: string;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed';
  votes: Vote[];
  results: PollResult[];
  remainingTime?: number;
  createdAt: string;
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
  timestamp: string;
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

export interface PollTemplate {
  _id: string;
  name: string;
  questions: TemplateQuestion[];
  createdAt: string;
}

export interface StudentReportEntry {
  studentId: string;
  studentName: string;
  totalAnswered: number;
  correctAnswers: number;
  score: number;
  accuracy: number;
  details: { question: string; option: string; correct: boolean }[];
}

export interface AppState {
  role: UserRole;
  studentName: string;
  studentId: string;
  roomCode: string;
  roomName: string;
  activePoll: PollData | null;
  pollResults: PollResult[];
  pollHistory: PollData[];
  connectedStudents: Student[];
  chatMessages: ChatMessage[];
  leaderboard: LeaderboardEntry[];
  pollQueue: QueuedPoll[];
  hasVoted: boolean;
  votedOption: string | null;
  isCorrect: boolean | null;
  remainingTime: number;
  pollStatus: PollStatus;
  canCreatePoll: boolean;
  error: string | null;
  isKicked: boolean;
  isConnected: boolean;
  theme: 'dark' | 'light';
}

export type AppAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_ROLE'; payload: UserRole }
  | { type: 'SET_STUDENT_INFO'; payload: { name: string; studentId: string } }
  | { type: 'SYNC_STATE'; payload: Partial<AppState> }
  | { type: 'POLL_STARTED'; payload: { poll: PollData; remainingTime: number } }
  | { type: 'UPDATE_RESULTS'; payload: PollResult[] }
  | { type: 'POLL_ENDED'; payload: { results: PollResult[]; correctAnswer: string | null } }
  | { type: 'UPDATE_STUDENTS'; payload: Student[] }
  | { type: 'SET_POLL_HISTORY'; payload: PollData[] }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_LEADERBOARD'; payload: LeaderboardEntry[] }
  | { type: 'VOTE_CONFIRMED'; payload: { option: string; isCorrect: boolean | null } }
  | { type: 'UPDATE_CAN_CREATE'; payload: boolean }
  | { type: 'UPDATE_QUEUE'; payload: QueuedPoll[] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_KICKED' }
  | { type: 'TICK_TIMER' }
  | { type: 'TOGGLE_THEME' };

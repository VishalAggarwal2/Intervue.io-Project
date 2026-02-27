import React, { createContext, useContext, useReducer, Dispatch } from 'react';
import { AppState, AppAction, PollData, PollResult } from '../types';

const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';

const initialState: AppState = {
  role: null,
  studentName: '',
  studentId: '',
  roomCode: '',
  roomName: '',
  activePoll: null,
  pollResults: [],
  pollHistory: [],
  connectedStudents: [],
  chatMessages: [],
  leaderboard: [],
  pollQueue: [],
  hasVoted: false,
  votedOption: null,
  isCorrect: null,
  remainingTime: 0,
  pollStatus: 'idle',
  canCreatePoll: true,
  error: null,
  isKicked: false,
  isConnected: false,
  theme: savedTheme,
};

function buildResultsFromPoll(poll: PollData): PollResult[] {
  return poll.results?.length > 0
    ? poll.results
    : poll.options.map((opt) => ({ option: opt, count: 0, percentage: 0 }));
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };

    case 'SET_ROLE':
      return { ...state, role: action.payload };

    case 'SET_STUDENT_INFO':
      return { ...state, studentName: action.payload.name, studentId: action.payload.studentId };

    case 'SYNC_STATE': {
      const p = action.payload;
      const activePoll = p.activePoll ?? state.activePoll;
      const pollStatus: AppState['pollStatus'] = activePoll ? 'active' : 'idle';
      return {
        ...state,
        ...p,
        pollStatus,
        activePoll,
        pollResults: activePoll ? buildResultsFromPoll(activePoll) : state.pollResults,
        remainingTime: activePoll?.remainingTime ?? state.remainingTime,
      };
    }

    case 'POLL_STARTED':
      return {
        ...state,
        activePoll: action.payload.poll,
        pollResults: buildResultsFromPoll(action.payload.poll),
        remainingTime: action.payload.remainingTime,
        pollStatus: 'active',
        hasVoted: false,
        votedOption: null,
        isCorrect: null,
        canCreatePoll: false,
        error: null,
      };

    case 'UPDATE_RESULTS':
      return {
        ...state,
        pollResults: action.payload,
        activePoll: state.activePoll ? { ...state.activePoll, results: action.payload } : null,
      };

    case 'POLL_ENDED': {
      const updatedPoll = state.activePoll
        ? {
            ...state.activePoll,
            status: 'completed' as const,
            results: action.payload.results,
            correctAnswer: action.payload.correctAnswer ?? state.activePoll.correctAnswer,
          }
        : null;
      return {
        ...state,
        pollStatus: 'ended',
        activePoll: updatedPoll,
        pollResults: action.payload.results,
        remainingTime: 0,
        canCreatePoll: true,
      };
    }

    case 'UPDATE_STUDENTS':
      return { ...state, connectedStudents: action.payload };

    case 'SET_POLL_HISTORY':
      return { ...state, pollHistory: action.payload };

    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] };

    case 'UPDATE_LEADERBOARD':
      return { ...state, leaderboard: action.payload };

    case 'VOTE_CONFIRMED':
      return {
        ...state,
        hasVoted: true,
        votedOption: action.payload.option,
        isCorrect: action.payload.isCorrect,
      };

    case 'UPDATE_CAN_CREATE':
      return { ...state, canCreatePoll: action.payload };

    case 'UPDATE_QUEUE':
      return { ...state, pollQueue: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_KICKED':
      return { ...state, isKicked: true };

    case 'TICK_TIMER':
      return { ...state, remainingTime: Math.max(0, state.remainingTime - 1) };

    case 'TOGGLE_THEME': {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { ...state, theme: next };
    }

    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue>({
  state: initialState,
  dispatch: () => undefined,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => useContext(AppContext);

import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Dispatch } from 'react';
import { AppAction, PollData, PollResult, Student, ChatMessage, LeaderboardEntry, QueuedPoll } from '../types';

interface StateSync {
  role: 'teacher' | 'student';
  roomCode?: string;
  roomName?: string;
  activePoll: PollData | null;
  students?: Student[];
  pollHistory?: PollData[];
  chatMessages?: ChatMessage[];
  leaderboard?: LeaderboardEntry[];
  pollQueue?: QueuedPoll[];
  canCreatePoll?: boolean;
  hasVoted?: boolean;
  votedOption?: string | null;
}

export function useSocketEvents(socket: Socket | null, dispatch: Dispatch<AppAction>): void {
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => dispatch({ type: 'SET_CONNECTED', payload: true });
    const onDisconnect = () => dispatch({ type: 'SET_CONNECTED', payload: false });

    const onStateSync = (data: StateSync) => {
      dispatch({
        type: 'SYNC_STATE',
        payload: {
          activePoll: data.activePoll,
          connectedStudents: data.students ?? [],
          pollHistory: data.pollHistory ?? [],
          chatMessages: data.chatMessages ?? [],
          leaderboard: data.leaderboard ?? [],
          pollQueue: data.pollQueue ?? [],
          canCreatePoll: data.canCreatePoll ?? true,
          hasVoted: data.hasVoted ?? false,
          votedOption: data.votedOption ?? null,
          roomCode: data.roomCode ?? '',
          roomName: data.roomName ?? '',
        },
      });
    };

    const onPollStarted = (data: { poll: PollData; remainingTime: number }) =>
      dispatch({ type: 'POLL_STARTED', payload: data });

    const onResultsUpdate = (data: { results: PollResult[] }) =>
      dispatch({ type: 'UPDATE_RESULTS', payload: data.results });

    const onPollEnded = (data: { results: PollResult[]; correctAnswer: string | null }) =>
      dispatch({ type: 'POLL_ENDED', payload: data });

    const onStudentsUpdate = (data: { students: Student[] }) =>
      dispatch({ type: 'UPDATE_STUDENTS', payload: data.students });

    const onLeaderboardUpdate = (data: { leaderboard: LeaderboardEntry[] }) =>
      dispatch({ type: 'UPDATE_LEADERBOARD', payload: data.leaderboard });

    const onVoteConfirmed = (data: { option: string; isCorrect: boolean | null }) =>
      dispatch({ type: 'VOTE_CONFIRMED', payload: data });

    const onCanCreateUpdate = (data: { canCreate: boolean }) =>
      dispatch({ type: 'UPDATE_CAN_CREATE', payload: data.canCreate });

    const onQueueUpdate = (data: { queue: QueuedPoll[] }) =>
      dispatch({ type: 'UPDATE_QUEUE', payload: data.queue });

    const onChatMessage = (msg: ChatMessage) =>
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: msg });

    const onError = (data: { message: string }) => {
      dispatch({ type: 'SET_ERROR', payload: data.message });
      setTimeout(() => dispatch({ type: 'SET_ERROR', payload: null }), 5000);
    };

    const onKicked = () => dispatch({ type: 'SET_KICKED' });

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('state:sync', onStateSync);
    socket.on('poll:started', onPollStarted);
    socket.on('poll:results_update', onResultsUpdate);
    socket.on('poll:ended', onPollEnded);
    socket.on('students:update', onStudentsUpdate);
    socket.on('leaderboard:update', onLeaderboardUpdate);
    socket.on('vote:confirmed', onVoteConfirmed);
    socket.on('poll:can_create_update', onCanCreateUpdate);
    socket.on('queue:update', onQueueUpdate);
    socket.on('chat:message', onChatMessage);
    socket.on('error', onError);
    socket.on('student:kicked', onKicked);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('state:sync', onStateSync);
      socket.off('poll:started', onPollStarted);
      socket.off('poll:results_update', onResultsUpdate);
      socket.off('poll:ended', onPollEnded);
      socket.off('students:update', onStudentsUpdate);
      socket.off('leaderboard:update', onLeaderboardUpdate);
      socket.off('vote:confirmed', onVoteConfirmed);
      socket.off('poll:can_create_update', onCanCreateUpdate);
      socket.off('queue:update', onQueueUpdate);
      socket.off('chat:message', onChatMessage);
      socket.off('error', onError);
      socket.off('student:kicked', onKicked);
    };
  }, [socket, dispatch]);
}

import React, { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useAppContext } from '../../contexts/AppContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useTimer } from '../../hooks/useTimer';
import NameEntry from './NameEntry';
import QuestionCard from './QuestionCard';
import ResultsView from './ResultsView';
import ChatPopup from '../Chat/ChatPopup';
import ThemeToggle from '../Common/ThemeToggle';

interface StudentDashboardProps {
  socket: Socket | null;
  roomCode: string;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ socket, roomCode }) => {
  const { state, dispatch } = useAppContext();
  useSocketEvents(socket, dispatch);
  useTimer(state.pollStatus, state.remainingTime, dispatch);

  // Re-announce on reconnect (resilience)
  useEffect(() => {
    if (!socket || !state.studentName || !state.studentId) return;
    const announce = () =>
      socket.emit('student:join-room', {
        roomCode: roomCode.toUpperCase(),
        name: state.studentName,
        studentId: state.studentId,
      });
    socket.on('connect', announce);
    return () => { socket.off('connect', announce); };
  }, [socket, state.studentName, state.studentId, roomCode]);

  if (state.isKicked) {
    return (
      <div className="full-screen-state">
        <div className="card kicked-card">
          <span className="kicked-icon">🚫</span>
          <h2>You've been removed</h2>
          <p>The teacher has removed you from this session.</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Rejoin Session
          </button>
        </div>
      </div>
    );
  }

  if (!state.studentName) {
    return (
      <NameEntry
        socket={socket}
        roomCode={roomCode.toUpperCase()}
        roomName={state.roomName}
        onJoin={(name, studentId) =>
          dispatch({ type: 'SET_STUDENT_INFO', payload: { name, studentId } })
        }
      />
    );
  }

  const showQuestion = state.pollStatus === 'active' && !state.hasVoted && state.remainingTime > 0;
  const showResults = state.hasVoted || state.pollStatus === 'ended';

  return (
    <div className="dashboard student-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="app-title">
            <span className="role-badge student">Student</span>
            Live Polling
          </h1>
          <span className="student-name-display">👤 {state.studentName}</span>
        </div>
        <div className="header-right">
          <ThemeToggle />
          <span className={`connection-dot ${state.isConnected ? 'online' : 'offline'}`} />
          <span className="connection-label">
            {state.isConnected ? 'Connected' : 'Reconnecting…'}
          </span>
        </div>
      </header>

      {state.error && <div className="error-banner" role="alert">⚠️ {state.error}</div>}

      <main className="student-main">
        {state.pollStatus === 'idle' && (
          <div className="card waiting-card">
            <div className="waiting-animation"><div className="pulse-dot" /></div>
            <h2>Waiting for a question…</h2>
            <p>The teacher will start a poll soon.</p>
          </div>
        )}

        {showQuestion && state.activePoll && (
          <QuestionCard
            poll={state.activePoll}
            socket={socket}
            studentId={state.studentId}
            remainingTime={state.remainingTime}
            hasVoted={state.hasVoted}
          />
        )}

        {showResults && (
          <ResultsView
            poll={state.activePoll}
            results={state.pollResults}
            votedOption={state.votedOption}
            isCorrect={state.isCorrect}
            pollEnded={state.pollStatus === 'ended'}
            leaderboard={state.leaderboard}
            studentId={state.studentId}
          />
        )}

        {state.pollStatus === 'active' && !state.hasVoted && state.remainingTime <= 0 && (
          <div className="card waiting-card">
            <span className="time-up-icon">⏰</span>
            <h2>Time's Up!</h2>
            <p>Waiting for results…</p>
          </div>
        )}
      </main>

      <ChatPopup socket={socket} messages={state.chatMessages} sender={state.studentName} role="student" roomCode={roomCode} />
    </div>
  );
};

export default StudentDashboard;

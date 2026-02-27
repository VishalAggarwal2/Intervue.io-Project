import React, { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAppContext } from '../../contexts/AppContext';
import { useSocketEvents } from '../../hooks/useSocketEvents';
import { useTimer } from '../../hooks/useTimer';
import CreatePoll from './CreatePoll';
import TeacherLiveView from './TeacherLiveView';
import TeacherChatPanel from './TeacherChatPanel';

interface TeacherDashboardProps {
  socket: Socket | null;
  roomCode: string;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ socket, roomCode }) => {
  const { state, dispatch } = useAppContext();
  const [showCreate, setShowCreate] = useState(true);

  useSocketEvents(socket, dispatch);
  useTimer(state.pollStatus, state.remainingTime, dispatch);

  useEffect(() => {
    if (!socket) return;
    const announce = () => socket.emit('teacher:join-room', { roomCode: roomCode.toUpperCase() });
    announce();
    socket.on('connect', announce);
    return () => { socket.off('connect', announce); };
  }, [socket, roomCode]);

  // Switch to live view when a poll starts
  useEffect(() => {
    if (state.pollStatus === 'active') setShowCreate(false);
  }, [state.pollStatus]);

  const inLiveView = !showCreate && (state.pollStatus === 'active' || state.pollStatus === 'ended');

  return (
    <div className="teacher-view">
      {/* ── Header ── */}
      <header className="tv-header">
        <div className="tv-header-left">
          <span className="tv-badge">✦ Intervue Poll</span>
          {state.roomName && state.roomName !== 'Untitled Room' && (
            <span className="tv-room-name">{state.roomName}</span>
          )}
          <span className="tv-room-chip">Room: <strong>{roomCode}</strong></span>
        </div>
        <div className="tv-header-right">
          <span className="tv-participants-count">
            <span className="tv-participants-dot" />
            {state.connectedStudents.length} participant{state.connectedStudents.length !== 1 ? 's' : ''}
          </span>
          <span className={`tv-status-dot ${state.isConnected ? 'online' : 'offline'}`} />
        </div>
      </header>

      {state.error && <div className="tv-error-bar">{state.error}</div>}

      {/* ── Always-visible 2-column layout ── */}
      <div className="tv-main-layout">
        {/* Left: create form or live view */}
        <div className="tv-main-col">
          {!inLiveView ? (
            <div className="tv-create-wrapper">
              <CreatePoll
                socket={socket}
                roomCode={roomCode}
                canCreate={state.canCreatePoll}
                isActive={state.pollStatus === 'active'}
              />
            </div>
          ) : (
            <TeacherLiveView
              activePoll={state.activePoll}
              results={state.pollResults}
              remainingTime={state.remainingTime}
              pollStatus={state.pollStatus}
              students={state.connectedStudents}
              canCreatePoll={state.canCreatePoll}
              onAskNew={() => setShowCreate(true)}
            />
          )}
        </div>

        {/* Right: persistent sidebar — Participants | Queue | Chat */}
        <div className="tv-sidebar-col">
          <TeacherChatPanel
            socket={socket}
            messages={state.chatMessages}
            roomCode={roomCode}
            students={state.connectedStudents}
            pollQueue={state.pollQueue}
            pollStatus={state.pollStatus}
          />
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

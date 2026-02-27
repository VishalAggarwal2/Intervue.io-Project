import React, { useState, useRef, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { ChatMessage, PollStatus, QueuedPoll, Student } from '../../types';

interface TeacherChatPanelProps {
  socket: Socket | null;
  messages: ChatMessage[];
  roomCode: string;
  students: Student[];
  pollQueue: QueuedPoll[];
  pollStatus: PollStatus;
}

const TYPE_LABEL: Record<string, string> = {
  mcq: 'MCQ',
  truefalse: 'T/F',
  rating: 'Rating',
  openended: 'Open',
};

const TeacherChatPanel: React.FC<TeacherChatPanelProps> = ({
  socket,
  messages,
  roomCode,
  students,
  pollQueue,
  pollStatus,
}) => {
  const [tab, setTab] = useState<'participants' | 'queue' | 'chat'>('participants');
  const [message, setMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socket) return;
    socket.emit('chat:send', { roomCode, message: message.trim(), sender: 'Teacher', role: 'teacher' });
    setMessage('');
  };

  const handleKick = (studentSocketId: string, name: string) => {
    if (!socket) return;
    if (window.confirm(`Remove "${name}" from the session?`)) {
      socket.emit('student:kick', { roomCode: roomCode.toUpperCase(), studentSocketId });
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    if (!socket) return;
    socket.emit('poll:queue:remove', { roomCode, index });
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isPolling = pollStatus === 'active';

  return (
    <div className="tv-chat-panel">
      {/* ── Tabs ── */}
      <div className="tv-chat-tabs">
        <button
          className={`tv-chat-tab ${tab === 'participants' ? 'active' : ''}`}
          onClick={() => setTab('participants')}
        >
          Participants
          {students.length > 0 && (
            <span className="tv-tab-badge">{students.length}</span>
          )}
        </button>
        <button
          className={`tv-chat-tab ${tab === 'queue' ? 'active' : ''}`}
          onClick={() => setTab('queue')}
        >
          Queue
          {pollQueue.length > 0 && (
            <span className="tv-tab-badge accent">{pollQueue.length}</span>
          )}
        </button>
        <button
          className={`tv-chat-tab ${tab === 'chat' ? 'active' : ''}`}
          onClick={() => setTab('chat')}
        >
          Chat
          {messages.length > 0 && (
            <span className="tv-tab-badge">{messages.length}</span>
          )}
        </button>
      </div>

      {/* ── Participants Tab ── */}
      {tab === 'participants' && (
        <div className="tv-participants-list">
          {students.length === 0 ? (
            <div className="tv-sidebar-empty">
              <span className="tv-sidebar-empty-icon">👥</span>
              <p>No one's joined yet.</p>
              <p className="tv-sidebar-empty-sub">Share your room code to get started.</p>
            </div>
          ) : (
            students.map((s) => {
              const statusLabel = !isPolling ? 'Online' : s.votedInCurrentPoll ? 'Answered' : 'Waiting';
              const statusClass = !isPolling ? 'online' : s.votedInCurrentPoll ? 'voted' : '';
              return (
                <div key={s.socketId} className="tv-participant-row">
                  <span className="tv-participant-avatar">{s.name.charAt(0).toUpperCase()}</span>
                  <span className="tv-participant-name">{s.name}</span>
                  <span className={`tv-participant-status ${statusClass}`}>{statusLabel}</span>
                  <button
                    className="tv-kick-btn"
                    onClick={() => handleKick(s.socketId, s.name)}
                    title={`Remove ${s.name}`}
                  >×</button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Queue Tab ── */}
      {tab === 'queue' && (
        <div className="tv-queue-panel">
          {pollQueue.length === 0 ? (
            <div className="tv-sidebar-empty">
              <span className="tv-sidebar-empty-icon">📋</span>
              <p>No questions queued.</p>
              <p className="tv-sidebar-empty-sub">
                Fill in the form and click <strong>+ Add to Queue</strong> while a poll is active.
              </p>
            </div>
          ) : (
            <div className="tv-queue-items">
              {pollQueue.map((item, i) => (
                <div key={i} className="tv-sidebar-queue-item">
                  <span className="tv-sidebar-queue-index">#{i + 1}</span>
                  <div className="tv-sidebar-queue-body">
                    <p className="tv-sidebar-queue-text" title={item.question}>{item.question}</p>
                    <div className="tv-sidebar-queue-meta">
                      <span className="tv-queue-type-chip">{TYPE_LABEL[item.type] ?? item.type}</span>
                      <span className="tv-sidebar-queue-timer">{item.timer}s</span>
                    </div>
                  </div>
                  <button
                    className="tv-kick-btn"
                    onClick={() => handleRemoveFromQueue(i)}
                    title="Remove from queue"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Chat Tab ── */}
      {tab === 'chat' && (
        <>
          <div className="tv-chat-messages">
            {messages.length === 0 && (
              <div className="tv-chat-empty">No messages yet</div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`tv-chat-bubble ${msg.sender === 'Teacher' ? 'own' : ''}`}
              >
                <span className="tv-chat-sender">{msg.sender}</span>
                <div className={`tv-chat-text ${msg.sender === 'Teacher' ? 'own' : ''}`}>
                  {msg.message}
                </div>
                <span className="tv-chat-time">{formatTime(msg.timestamp)}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form className="tv-chat-input-row" onSubmit={sendMessage}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message…"
              className="tv-chat-input"
              maxLength={500}
            />
            <button type="submit" className="tv-chat-send" disabled={!message.trim()}>
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default TeacherChatPanel;

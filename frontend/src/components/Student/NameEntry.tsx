import React, { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';

interface NameEntryProps {
  socket: Socket | null;
  roomCode: string;
  roomName: string;
  onJoin: (name: string, studentId: string) => void;
}

const NameEntry: React.FC<NameEntryProps> = ({ socket, roomCode, roomName, onJoin }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const onNameTaken = (data: { message: string }) => {
      setError(data.message);
      setIsJoining(false);
    };
    const onRoomError = (data: { message: string }) => {
      setError(data.message);
      setIsJoining(false);
    };
    socket.on('name:taken', onNameTaken);
    socket.on('room:error', onRoomError);
    return () => { socket.off('name:taken', onNameTaken); socket.off('room:error', onRoomError); };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !socket) return;

    let studentId = sessionStorage.getItem(`studentId:${roomCode}`);
    if (!studentId) {
      studentId = crypto.randomUUID();
      sessionStorage.setItem(`studentId:${roomCode}`, studentId);
    }

    setIsJoining(true);
    setError('');

    socket.emit('student:join-room', { roomCode, name: trimmed, studentId });
    onJoin(trimmed, studentId);
  };

  return (
    <div className="name-entry-screen">
      <div className="name-entry-card card">
        <div className="name-entry-icon">🎓</div>
        <h1 className="name-entry-title">Join Session</h1>
        <p className="name-entry-subtitle">
          Room: <strong>{roomName || roomCode}</strong>
          <span className="room-code-chip">{roomCode}</span>
        </p>

        <form onSubmit={handleSubmit} className="name-entry-form">
          <div className="form-group">
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Your name..."
              className={`form-input name-input ${error ? 'input-error' : ''}`}
              maxLength={30}
              autoFocus
              disabled={isJoining}
            />
            {error && <p className="field-error">{error}</p>}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={!name.trim() || isJoining}
          >
            {isJoining ? 'Joining…' : 'Join Session →'}
          </button>
        </form>
        <p className="name-entry-note">Each browser tab is a unique participant.</p>
      </div>
    </div>
  );
};

export default NameEntry;

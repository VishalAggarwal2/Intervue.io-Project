import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';
import ThemeToggle from '../components/Common/ThemeToggle';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [roomInput, setRoomInput] = useState('');
  const [roomName, setRoomName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleCreateRoom = async () => {
    setCreating(true);
    try {
      const { roomCode } = await createRoom(roomName || undefined);
      navigate(`/teacher/${roomCode}`);
    } catch {
      setCreating(false);
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomInput.trim().toUpperCase();
    if (code.length < 4) { setJoinError('Enter a valid room code'); return; }
    navigate(`/student/${code}`);
  };

  return (
    <div className="landing-screen">
      <div className="theme-top-right"><ThemeToggle /></div>

      <div className="landing-container">
        <div className="landing-hero">
          <h1 className="landing-title"><span className="gradient-text">Live Polling</span></h1>
          <p className="landing-subtitle">
            Real-time interactive polls · Multiple question types · Live leaderboard
            <br />
            Refresh-resilient · Room-based · Works anywhere
          </p>
        </div>

        <div className="role-cards">
          {/* Teacher */}
          <div className="role-card teacher-card">
            <span className="role-card-icon">👩‍🏫</span>
            <h2>I'm a Teacher</h2>
            <p>Create a room and run live polls with your class.</p>
            <ul className="role-features">
              <li>✓ MCQ, True/False, Rating, Open-ended</li>
              <li>✓ Correct answer + leaderboard</li>
              <li>✓ QR code for instant student join</li>
              <li>✓ Export results as CSV</li>
            </ul>
            <div className="create-room-form">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room name (optional)"
                className="form-input"
                maxLength={40}
              />
              <button
                className="btn btn-primary btn-full"
                onClick={handleCreateRoom}
                disabled={creating}
              >
                {creating ? 'Creating…' : '🚀 Create Room'}
              </button>
            </div>
          </div>

          {/* Student */}
          <div className="role-card student-card">
            <span className="role-card-icon">🎓</span>
            <h2>I'm a Student</h2>
            <p>Enter a room code or scan a QR code to join.</p>
            <ul className="role-features">
              <li>✓ Server-synced timer</li>
              <li>✓ See if your answer was correct</li>
              <li>✓ Live leaderboard position</li>
              <li>✓ Chat with the class</li>
            </ul>
            <form onSubmit={handleJoinRoom} className="join-room-form">
              <input
                type="text"
                value={roomInput}
                onChange={(e) => { setRoomInput(e.target.value.toUpperCase()); setJoinError(''); }}
                placeholder="Room code (e.g. ABC123)"
                className={`form-input ${joinError ? 'input-error' : ''}`}
                maxLength={6}
              />
              {joinError && <p className="field-error">{joinError}</p>}
              <button type="submit" className="btn btn-primary btn-full" disabled={!roomInput.trim()}>
                Join Room →
              </button>
            </form>
          </div>
        </div>

        <p className="landing-note">
          🔄 Refresh-resilient — state is always recovered from the server.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
